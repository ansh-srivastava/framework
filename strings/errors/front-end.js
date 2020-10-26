/**
 * Created by krasilneg on 08.05.17.
 */
const codes = require('core/errors/front-end');
const {t} = require('core/i18n');

module.exports = {
  [codes.ACCESS_DENIED]: t(`Недостаточно прав на выполнение операции.`)
};
