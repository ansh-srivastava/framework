'use strict';
/* eslint no-process-exit:off */
/**
 * Created by krasilneg on 19.07.17.
 */
const config = require('../config');
const di = require('core/di');
const extend = require('extend');
const IonLogger = require('core/impl/log/IonLogger');

const sysLog = new IonLogger(config.log || {});
const errorSetup = require('core/error-setup');
const i18n = require('core/i18n');
const lang = config.lang || 'en';
const t = msg => i18n.t(msg)({lang, domain: 'schedule'});
errorSetup();


// jshint maxcomplexity: 20, maxstatements: 30

di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents'])
  .then(scope =>
    di(
      'app',
      di.extract('scheduler', extend(true, config.di, scope.settings.get('plugins') || {})),
      {},
      'boot'
    )
  )
  .then(
    /**
     * @param {{}} scope
     * @param {SettingsRepository} [scope.settings]
     * @returns {Promise}
     */
    (scope) => {
      return scope.scheduler.start();
    }
  )
  .then(() => {
    sysLog.info(t('Schedule started'));
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });