/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 12/21/16.
 */

const moment = require('moment');
const util = require('util');

var segments = ['year', 'month', 'day', 'weekday', 'hour', 'minute', 'second'];
var segmentCaptions = {
  month: ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь',
    'ноябрь', 'декабрь'],
  weekday: ['', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
};

function getLevels(keys) {
  var result = {
    top: null,
    base: []
  };
  for (var i = 0; i < segments.length; i++) {
    if (keys.indexOf(segments[i]) > -1) {
      if (!result.top) {
        result.top = segments[i];
      } else {
        result.base.push(segments[i]);
      }
    }
  }
  return result;
}

function getBaseString(base) {
  var result = '';
  Object.keys(base).forEach(function (baseKey) {
    result += baseKey + ':' + base[baseKey] + ';';
  });
  return result;
}

function getBase(occur, baseKeys) {
  var result = {};
  for (var i = 0; i < baseKeys.length; i++) {
    result[baseKeys[i]] = occur[baseKeys[i]];
  }
  result.duration = occur.duration;
  return result;
}

function isSequential(values) {
  if (values.length > 2) {
    for (var i = 1; i < values.length; i++) {
      if (values[i] - values[i - 1] > 1) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function createTopPeriod(segment, values) {
  var i;
  var result = '';
  if (isSequential(values)) {
    if (segmentCaptions[segment]) {
      result = segmentCaptions[segment][values[0]] + '-' + segmentCaptions[segment][values[values.length - 1]];
    } else {
      result = values[0] + '-' + values[values.length - 1];
    }
  } else {
    if (segmentCaptions[segment]) {
      for (i = 0; i < values.length; i++) {
        if (segmentCaptions[segment][values[i]]) {
          result += segmentCaptions[segment][values[i]];
          if (i !== values.length - 1) {
            result += ',';
          }
        }
      }
    } else {
      for (i = 0; i < values.length; i++) {
        result += segmentCaptions[segment][values[i]];
        if (i !== values.length - 1) {
          result += ',';
        }
      }
    }
  }
  return result;
}

function getDurationSegments(duration) {
  return {
    year: duration.years(),
    month: duration.months(),
    day: duration.days(),
    weekday: duration.weeks(),
    hour: duration.hours(),
    minute: duration.minutes(),
    second: duration.seconds()
  };
}

function intervalToString(start, end, mask) {
  var s = getDurationSegments(start);
  var e = getDurationSegments(end);
  var startString = '';
  var endString = '';
  if (mask.indexOf('month') > -1) {
    startString += segmentCaptions.month[s.month];
    endString += segmentCaptions.month[e.month];
  }
  if (mask.indexOf('day') > -1) {
    startString += (startString ? ' ' : '') + s.day + ' день';
    endString += (endString ? ' ' : '') + e.day + ' день';
  }
  /*If (mask.indexOf('weekday') > -1) {
    StartString += segmentCaptions.month[s.month];
    endString += segmentCaptions.month[e.month];
  }
  */
  if (mask.indexOf('hour') > -1 || mask.indexOf('minute') > -1 || mask.indexOf('second') > -1) {
    if (s.second || e.second) {
      startString += (startString ? ' ' : '') + moment({hours: s.hour, minutes: s.minute, seconds: s.second}).format('HH:mm:ss');
      endString += (endString ? ' ' : '') + moment({hours: e.hour, minutes: e.minute, seconds: e.second}).format('HH:mm:ss');
    } else {
      startString += (startString ? ' ' : '') + moment({hours: s.hour, minutes: s.minute}).format('HH:mm');
      endString += (endString ? ' ' : '') + moment({hours: e.hour, minutes: e.minute}).format('HH:mm');
    }
  }
  return 'с ' + startString + ' до ' + endString;
}

function getMask(duration) {
  var d = getDurationSegments(duration);
  for (var i = 0; i < segments.length; i++) {
    if (d[segments[i]]) {
      return Object.keys(d);
    } else {
      delete d[segments[i]];
    }
  }
  return Object.keys(d);
}

function createBasePeriod(group) {
  var result = '';
  var start = moment.duration({
    seconds: group.base.second ? group.base.second : null,
    minutes: group.base.minute ? group.base.minute : null,
    hours: group.base.hour ? group.base.hour : null,
    days: group.base.day ? group.base.day : null,
    months: group.base.month ? group.base.month : null
  });
  var diff = moment.duration(group.base.duration * 1000);
  if (!getDurationSegments(diff)[group.top]) {
    var end = moment.duration(start);
    end.add(diff);
    var mask = getMask(end);
    result = intervalToString(start, end, mask);
  }
  return result;
}

module.exports.scheduleToString = function (value) {
  var result = '';
  var groups = {};
  value.occurs.forEach(function (occur) {
    var levels = getLevels(Object.keys(occur));
    if (levels.top) {
      if (!groups.hasOwnProperty(levels.top)) {
        groups[levels.top] = {};
      }
      var base = getBase(occur, levels.base);
      var baseString = getBaseString(base);
      if (!groups[levels.top].hasOwnProperty(baseString)) {
        groups[levels.top][baseString] = {
          top: levels.top,
          base: base,
          values: []
        };
      }
      groups[levels.top][baseString].values.push(occur[levels.top]);
    }
  });
  Object.keys(groups).forEach(function (top) {
    Object.keys(groups[top]).forEach(function (baseKey) {
      groups[top][baseKey].values.sort(function (a, b) {
        return a - b;
      });
      result += createTopPeriod(top, groups[top][baseKey].values);
      result += ' ' + createBasePeriod(groups[top][baseKey]);
      result += ' (';
      result += '); ';
    });
  });
  return result;
};
