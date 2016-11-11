/**
 * Created by kras on 24.10.16.
 */
'use strict';

function WorkflowProvider() {
  /**
   * @param {Item} item
   * @returns {Promise}
   */
  this.getStatus = function (item) {
    return this._getStatus(item);
  };

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @returns {Promise}
   */
  this.performTransition = function (item, workflow, name) {
    return this._performTransition(item, workflow, name);
  };
}

module.exports = WorkflowProvider;
