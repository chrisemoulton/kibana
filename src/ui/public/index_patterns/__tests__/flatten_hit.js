import _ from 'lodash';
import expect from 'expect.js';
import ngMock from 'ng_mock';
import IndexPatternsFlattenHitProvider from 'ui/index_patterns/_flatten_hit';

describe('IndexPattern#flattenHit()', function () {


  var flattenHit;
  var config;
  var hit;
  var flat;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (Private, $injector) {
    var indexPattern = {
      fields: {
        byName: {
          'message': { type: 'string' },
          'geo.coordinates': { type: 'geo_point' },
          'geo.dest': { type: 'string' },
          'geo.src': { type: 'string' },
          'bytes': { type: 'number' },
          '@timestamp': { type: 'date' },
          'team': { type: 'nested' },
          'team.name': { type: 'string' },
          'team.role': { type: 'string' },
          'user': { type: 'conflict' },
          'user.name': { type: 'string' },
          'user.id': { type: 'conflict' },
          'delta': { type: 'number', scripted: true }
        }
      }
    };

    flattenHit = Private(IndexPatternsFlattenHitProvider)(indexPattern).uncached;
    config = $injector.get('config');

    hit = {
      _source: {
        message: 'Hello World',
        geo: {
          coordinates: { lat: 33.4500, lon: 112.0667 },
          dest: 'US',
          src: 'IN'
        },
        bytes: 10039103,
        '@timestamp': (new Date()).toString(),
        tags: [{ text: 'foo' }, { text: 'bar' }],
        groups: ['loners'],
        noMapping: true,
        team: [
          { name: 'foo', role: 'leader' },
          { name: 'bar', role: 'follower' },
          { name: 'baz', role: 'party boy' },
        ],
        user: { name: 'smith', id: 123 }
      },
      fields: {
        delta: [42],
        random: [0.12345]
      }
    };

    flat = flattenHit(hit);
  }));

  it('flattens keys as far down as the mapping goes', function () {
    expect(flat).to.have.property('geo.coordinates', hit._source.geo.coordinates);
    expect(flat).to.not.have.property('geo.coordinates.lat');
    expect(flat).to.not.have.property('geo.coordinates.lon');
    expect(flat).to.have.property('geo.dest', 'US');
    expect(flat).to.have.property('geo.src', 'IN');
    expect(flat).to.have.property('@timestamp', hit._source['@timestamp']);
    expect(flat).to.have.property('message', 'Hello World');
    expect(flat).to.have.property('bytes', 10039103);
  });

  it('flattens keys not in the mapping', function () {
    expect(flat).to.have.property('noMapping', true);
    expect(flat).to.have.property('groups');
    expect(flat.groups).to.eql(['loners']);
  });

  it('flattens conflicting types in the mapping', function () {
    expect(flat).to.not.have.property('user');
    expect(flat).to.have.property('user.name', hit._source.user.name);
    expect(flat).to.have.property('user.id', hit._source.user.id);
  });

  it('preserves objects in arrays', function () {
    expect(flat).to.have.property('tags', hit._source.tags);
  });

  it('does not enter into nested fields', function () {
    expect(flat).to.have.property('team', hit._source.team);
    expect(flat).to.not.have.property('team.name');
    expect(flat).to.not.have.property('team.role');
    expect(flat).to.not.have.property('team[0]');
    expect(flat).to.not.have.property('team.0');
  });

  it('unwraps script fields', function () {
    expect(flat).to.have.property('delta', 42);
  });

  it('assumes that all fields are "computed fields"', function () {
    expect(flat).to.have.property('random', 0.12345);
  });

  it('ignores fields that start with an _ and are not in the metaFields', function () {
    config.set('metaFields', ['_metaKey']);
    hit.fields._notMetaKey = [100];
    flat = flattenHit(hit);
    expect(flat).to.not.have.property('_notMetaKey');
  });

  it('includes underscore-prefixed keys that are in the metaFields', function () {
    config.set('metaFields', ['_metaKey']);
    hit.fields._metaKey = [100];
    flat = flattenHit(hit);
    expect(flat).to.have.property('_metaKey', 100);
  });

  it('adapts to changes in the metaFields', function () {
    hit.fields._metaKey = [100];

    config.set('metaFields', ['_metaKey']);
    flat = flattenHit(hit);
    expect(flat).to.have.property('_metaKey', 100);

    config.set('metaFields', []);
    flat = flattenHit(hit);
    expect(flat).to.not.have.property('_metaKey');
  });

  it('handles fields that are not arrays, like _timestamp', function () {
    hit.fields._metaKey = 20000;
    config.set('metaFields', ['_metaKey']);
    flat = flattenHit(hit);
    expect(flat).to.have.property('_metaKey', 20000);
  });
});
