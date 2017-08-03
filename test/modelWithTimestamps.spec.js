const { Model: KnormModel } = require('knorm');
const expect = require('unexpected').clone();
const modelWithTimestamps = require('../lib/modelWithTimestamps');

describe('modelWithTimestamps', () => {
  it('throws an error if not passed a knorm model subclass', () => {
    class Foo {}
    expect(
      () => modelWithTimestamps(Foo),
      'to throw',
      new Error('base class is not a knorm model class')
    );
  });

  it("accepts knorm's model class as the base class", () => {
    expect(() => modelWithTimestamps(KnormModel), 'not to throw');
  });

  it('returns a knorm model subclass', () => {
    class Foo extends KnormModel {}
    const Bar = modelWithTimestamps(Foo);
    expect(Bar.prototype, 'to be a', KnormModel);
  });

  describe('with a `createdAt` config', () => {
    class Foo extends KnormModel {}

    it('adds a `createdAt` field', () => {
      const Bar = modelWithTimestamps(Foo, { createdAt: true });
      expect(Bar.fields, 'to satisfy', {
        createdAt: {
          type: 'dateTime',
          column: 'created_at'
        }
      });
      expect(Bar.fieldNames, 'to satisfy', {
        createdAt: 'createdAt'
      });
    });

    it('allows configuring the `createdAt` type', () => {
      const Bar = modelWithTimestamps(Foo, {
        createdAt: { type: 'integer' }
      });
      expect(Bar.fields, 'to satisfy', {
        createdAt: {
          type: 'integer'
        }
      });
    });

    it('allows configuring the default `createdAt` value', () => {
      const Bar = modelWithTimestamps(Foo, {
        createdAt: { default: () => new Date() }
      });
      expect(Bar.fields, 'to satisfy', {
        createdAt: {
          default: expect
            .it('to be a function')
            .and('when called', 'to be a date')
        }
      });
    });

    it('allows configuring the `createdAt` field-name', () => {
      const Bar = modelWithTimestamps(Foo, { createdAt: { name: 'created' } });
      expect(Bar.fields, 'to satisfy', {
        createdAt: undefined,
        created: {
          type: 'dateTime'
        }
      });
      expect(Bar.fieldNames, 'to satisfy', {
        createdAt: 'created'
      });
    });

    it('allows configuring the `createdAt` field column-name', () => {
      const Bar = modelWithTimestamps(Foo, {
        createdAt: { column: 'created' }
      });
      expect(Bar.fields, 'to satisfy', {
        createdAt: {
          column: 'created'
        }
      });
    });
  });

  describe('with a `updatedAt` config', () => {
    class Foo extends KnormModel {}

    it('adds a `updatedAt` field', () => {
      const Bar = modelWithTimestamps(Foo, { updatedAt: true });
      expect(Bar.fields, 'to satisfy', {
        updatedAt: {
          type: 'dateTime',
          column: 'updated_at'
        }
      });
      expect(Bar.fieldNames, 'to satisfy', {
        updatedAt: 'updatedAt'
      });
    });

    it('allows configuring the `updatedAt` type', () => {
      const Bar = modelWithTimestamps(Foo, {
        updatedAt: { type: 'integer' }
      });
      expect(Bar.fields, 'to satisfy', {
        updatedAt: {
          type: 'integer'
        }
      });
    });

    it('allows configuring the default `updatedAt` value', () => {
      const Bar = modelWithTimestamps(Foo, {
        updatedAt: { default: () => new Date() }
      });
      expect(Bar.fields, 'to satisfy', {
        updatedAt: {
          default: expect
            .it('to be a function')
            .and('when called', 'to be a date')
        }
      });
    });

    it('allows configuring the `updatedAt` field-name', () => {
      const Bar = modelWithTimestamps(Foo, { updatedAt: { name: 'updated' } });
      expect(Bar.fields, 'to satisfy', {
        updatedAt: undefined,
        updated: {
          type: 'dateTime'
        }
      });
      expect(Bar.fieldNames, 'to satisfy', {
        updatedAt: 'updated'
      });
    });

    it('allows configuring the `updatedAt` field column-name', () => {
      const Bar = modelWithTimestamps(Foo, {
        updatedAt: { column: 'updated' }
      });
      expect(Bar.fields, 'to satisfy', {
        updatedAt: {
          column: 'updated'
        }
      });
    });
  });
});
