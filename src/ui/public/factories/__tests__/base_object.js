import angular from 'angular';
import _ from 'lodash';
import sinon from 'sinon';
import expect from 'expect.js';
import ngMock from 'ng_mock';
import 'ui/private';

describe('Base Object', function () {
  var $rootScope;
  var BaseObject;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (_$rootScope_, Private) {
    $rootScope = _$rootScope_;
    BaseObject = require('ui/utils/base_object');
  }));

  it('should take an inital set of values', function () {
    var baseObject = new BaseObject({ message: 'test' });
    expect(baseObject).to.have.property('message', 'test');
  });

  it('should serialize _attributes to RISON', function () {
    var baseObject = new BaseObject();
    baseObject.message = 'Testing... 1234';
    var rison = baseObject.toRISON();
    expect(rison).to.equal('(message:\'Testing... 1234\')');
  });

  it('should not serialize $$attributes to RISON', function () {
    var baseObject = new BaseObject();
    baseObject.$$attributes = { foo: 'bar' };
    baseObject.message = 'Testing... 1234';
    var rison = baseObject.toRISON();
    expect(rison).to.equal('(message:\'Testing... 1234\')');
  });

  it('should serialize _attributes for JSON', function () {
    var baseObject = new BaseObject();
    baseObject.message = 'Testing... 1234';
    baseObject._private = 'foo';
    baseObject.$private = 'stuff';
    var json = JSON.stringify(baseObject);
    expect(json).to.equal('{"message":"Testing... 1234"}');
  });

});
