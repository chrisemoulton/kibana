import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import dateMath from 'ui/utils/date_math';
import 'ui/state_management/global_state';
import 'ui/config';
import EventsProvider from 'ui/events';
import UtilsDiffTimePickerValsProvider from 'ui/utils/diff_time_picker_vals';
import TimefilterLibDiffTimeProvider from 'ui/timefilter/lib/diff_time';
import TimefilterLibDiffIntervalProvider from 'ui/timefilter/lib/diff_interval';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

uiRoutes
.addSetupWork(function (timefilter) {
  return timefilter.init();
});

uiModules
.get('kibana')
.service('timefilter', function (Private, globalState, $rootScope, config) {

  var Events = Private(EventsProvider);
  var diff = Private(UtilsDiffTimePickerValsProvider);


  function convertISO8601(stringTime) {
    var obj = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
    return obj.isValid() ? obj : stringTime;
  }

  _.class(Timefilter).inherits(Events);
  function Timefilter() {
    Timefilter.Super.call(this);

    var self = this;
    var diffTime = Private(TimefilterLibDiffTimeProvider)(self);
    var diffInterval = Private(TimefilterLibDiffIntervalProvider)(self);

    self.enabled = false;

    self.init = _.once(function () {
      return config.init()
      .then(self.consumeDefaults);
    });

    self.consumeDefaults = _.once(function () {
      var timeDefaults = config.get('timepicker:timeDefaults');
      var refreshIntervalDefaults = config.get('timepicker:refreshIntervalDefaults');

      // These can be date math strings or moments.
      self.time = _.defaults(globalState.time || {}, timeDefaults);
      self.refreshInterval = _.defaults(globalState.refreshInterval || {}, refreshIntervalDefaults);

      globalState.on('fetch_with_changes', function () {
        // clone and default to {} in one
        var newTime = _.defaults({}, globalState.time, timeDefaults);
        var newRefreshInterval = _.defaults({}, globalState.refreshInterval, refreshIntervalDefaults);

        if (newTime) {
          if (newTime.to) newTime.to = convertISO8601(newTime.to);
          if (newTime.from) newTime.from = convertISO8601(newTime.from);
        }

        self.time = newTime;
        self.refreshInterval = newRefreshInterval;
      });
    });

    $rootScope.$$timefilter = self;

    $rootScope.$watchMulti([
      '$$timefilter.time',
      '$$timefilter.time.from',
      '$$timefilter.time.to',
      '$$timefilter.time.mode'
    ], diffTime);

    $rootScope.$watchMulti([
      '$$timefilter.refreshInterval',
      '$$timefilter.refreshInterval.pause',
      '$$timefilter.refreshInterval.value'
    ], diffInterval);
  }

  Timefilter.prototype.get = function (indexPattern) {
    var filter;
    var timefield = indexPattern.timeFieldName && _.find(indexPattern.fields, {name: indexPattern.timeFieldName});

    if (timefield) {
      var bounds = this.getBounds();
      filter = {range : {}};
      filter.range[timefield.name] = {
        gte: bounds.min.valueOf(),
        lte: bounds.max.valueOf(),
        format: 'epoch_millis'
      };
    }

    return filter;
  };

  Timefilter.prototype.getBounds = function (timefield) {
    return {
      min: dateMath.parse(this.time.from),
      max: dateMath.parse(this.time.to, true)
    };
  };

  Timefilter.prototype.getActiveBounds = function () {
    if (this.enabled) return this.getBounds();
  };

  return new Timefilter();
});
