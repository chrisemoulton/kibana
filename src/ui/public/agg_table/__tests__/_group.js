import _ from 'lodash';
import $ from 'jquery';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import fixtures from 'fixtures/fake_hierarchical_data';
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';
import FixturesStubbedLogstashIndexPatternProvider from 'fixtures/stubbed_logstash_index_pattern';
import VisProvider from 'ui/vis';
describe('AggTableGroup Directive', function () {

  var $rootScope;
  var $compile;
  var tabifyAggResponse;
  var Vis;
  var indexPattern;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function ($injector, Private) {
    tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
    indexPattern = Private(FixturesStubbedLogstashIndexPatternProvider);
    Vis = Private(VisProvider);

    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');
  }));

  var $scope;
  beforeEach(function () {
    $scope = $rootScope.$new();
  });
  afterEach(function () {
    $scope.$destroy();
  });


  it('renders a simple split response properly', function () {
    var vis = new Vis(indexPattern, 'table');
    $scope.group = tabifyAggResponse(vis, fixtures.metricOnly);
    var $el = $('<kbn-agg-table-group group="group"></kbn-agg-table-group>');

    $compile($el)($scope);
    $scope.$digest();

    // should create one sub-tbale
    expect($el.find('kbn-agg-table').size()).to.be(1);
  });

  it('renders nothing if the table list is empty', function () {
    var $el = $('<kbn-agg-table-group group="group"></kbn-agg-table-group>');

    $scope.group = {
      tables: []
    };

    $compile($el)($scope);
    $scope.$digest();

    var $subTables = $el.find('kbn-agg-table');
    expect($subTables.size()).to.be(0);
  });

  it('renders a complex response properly', function () {
    var vis = new Vis(indexPattern, {
      type: 'pie',
      aggs: [
        { type: 'avg', schema: 'metric', params: { field: 'bytes' } },
        { type: 'terms', schema: 'split', params: { field: 'extension' } },
        { type: 'terms', schema: 'segment', params: { field: 'geo.src' } },
        { type: 'terms', schema: 'segment', params: { field: 'machine.os' } }
      ]
    });
    vis.aggs.forEach(function (agg, i) {
      agg.id = 'agg_' + (i + 1);
    });

    var group = $scope.group = tabifyAggResponse(vis, fixtures.threeTermBuckets);
    var $el = $('<kbn-agg-table-group group="group"></kbn-agg-table-group>');
    $compile($el)($scope);
    $scope.$digest();

    var $subTables = $el.find('kbn-agg-table');
    expect($subTables.size()).to.be(3);

    var $subTableHeaders = $el.find('.agg-table-group-header');
    expect($subTableHeaders.size()).to.be(3);

    $subTableHeaders.each(function (i) {
      expect($(this).text()).to.be(group.tables[i].title);
    });
  });
});
