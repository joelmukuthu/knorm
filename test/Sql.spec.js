const Knorm = require('../lib/Knorm');
const sinon = require('sinon');
const expect = require('unexpected')
  .clone()
  .use(require('unexpected-sinon'));

describe.only('Sql', () => {
  let Model;
  let Query;
  let Sql;
  let SqlPart;
  let SqlError;

  let User;
  let UserWithSchema;

  before(() => {
    const orm = new Knorm({});

    Model = orm.Model;
    Query = orm.Query;
    Sql = orm.Sql;
    SqlPart = Sql.SqlPart;
    SqlError = Sql.SqlError;

    User = class extends Model {};
    User.table = 'user';
    User.fields = {
      id: 'integer',
      name: 'string',
      description: 'text',
      confirmed: 'boolean'
    };

    UserWithSchema = class extends User {};
    UserWithSchema.schema = 'public';
  });

  let sql;

  beforeEach(() => {
    sql = new Sql(User);
  });

  describe('Sql.prototype.addValue', () => {
    it('adds a value to the values array', () => {
      sql.addValue('foo');
      expect(sql.getValues(), 'to equal', ['foo']);
    });

    it('maintains the order of values', () => {
      sql.addValue('foo');
      sql.addValue('bar');
      expect(sql.getValues(), 'to equal', ['foo', 'bar']);
    });

    it('allows chaining', () => {
      expect(sql.addValue('foo'), 'to be', sql);
    });
  });

  describe('Sql.prototype.addValues', () => {
    it('adds multiple values to the values array', () => {
      sql.addValues(['foo', 'bar']);
      expect(sql.getValues(), 'to equal', ['foo', 'bar']);
    });

    it('maintains the order of values', () => {
      sql.addValues(['foo', 'bar']);
      sql.addValues(['baz', 'quux']);
      expect(sql.getValues(), 'to equal', ['foo', 'bar', 'baz', 'quux']);
    });

    it('allows chaining', () => {
      expect(sql.addValues(['foo']), 'to be', sql);
    });
  });

  describe('Sql.prototype.getValues', () => {
    it('returns the currently added values', () => {
      expect(sql.getValues(), 'to equal', []);
      sql.addValues(['foo', 'bar']);
      expect(sql.getValues(), 'to equal', ['foo', 'bar']);
    });
  });

  describe('Sql.prototype.addField', () => {
    it('adds a field to the fields array', () => {
      sql.addField('foo');
      expect(sql.getFields(), 'to equal', ['foo']);
    });

    it('maintains the order of fields', () => {
      sql.addField('foo');
      sql.addField('bar');
      expect(sql.getFields(), 'to equal', ['foo', 'bar']);
    });

    it('allows chaining', () => {
      expect(sql.addField('foo'), 'to be', sql);
    });
  });

  describe('Sql.prototype.addFields', () => {
    it('adds multiple fields to the fields array', () => {
      sql.addFields(['foo', 'bar']);
      expect(sql.getFields(), 'to equal', ['foo', 'bar']);
    });

    it('maintains the order of fields', () => {
      sql.addFields(['foo', 'bar']);
      sql.addFields(['baz', 'quux']);
      expect(sql.getFields(), 'to equal', ['foo', 'bar', 'baz', 'quux']);
    });

    it('allows chaining', () => {
      expect(sql.addFields(['foo']), 'to be', sql);
    });
  });

  describe('Sql.prototype.getFields', () => {
    it('returns the currently added fields', () => {
      expect(sql.getFields(), 'to equal', []);
      sql.addFields(['foo', 'bar']);
      expect(sql.getFields(), 'to equal', ['foo', 'bar']);
    });
  });

  describe('Sql.prototype.setAlias', () => {
    it('sets the alias', () => {
      sql.setAlias('foo');
      expect(sql.getAlias(), 'to be', 'foo');
    });

    it('overwrites the alias when called again', () => {
      sql.setAlias('foo');
      sql.setAlias('bar');
      expect(sql.getAlias(), 'to be', 'bar');
    });

    it('allows chaining', () => {
      expect(sql.setAlias('foo'), 'to be', sql);
    });
  });

  describe('Sql.prototype.getAlias', () => {
    it('returns the currently set alias', () => {
      expect(sql.getAlias(), 'to be undefined');
      sql.setAlias('foo');
      expect(sql.getAlias(), 'to be', 'foo');
    });
  });

  describe('Sql.prototype.formatIdentifier', () => {
    it('quotes the identifier', () => {
      expect(sql.formatIdentifier('order'), 'to be', '"order"');
    });
  });

  describe('Sql.prototype.formatAlias', () => {
    describe('with the alias not set', () => {
      it('returns `undefined`', () => {
        expect(sql.formatAlias(), 'to be undefined');
      });
    });

    describe('with the alias set', () => {
      it('returns a quoted alias', () => {
        sql.setAlias('foo');
        expect(sql.formatAlias(), 'to be', '"foo"');
      });
    });
  });

  describe('Sql.prototype.formatTable', () => {
    it('returns a quoted `Model.table`', () => {
      expect(sql.formatTable(), 'to be', '"user"');
    });

    describe('with `Model.table` not configured', () => {
      it('throws an SqlError', () => {
        class Foo extends Model {}
        const sql = new Sql(Foo);
        expect(
          () => sql.formatTable(),
          'to throw',
          new SqlError({ sql, message: '`Foo.table` is not configured' })
        );
      });
    });

    describe('with `Model.schema` configured', () => {
      it('returns a quoted `Model.schema`-qualified `Model.table`', () => {
        expect(
          new Sql(UserWithSchema).formatTable(),
          'to be',
          '"public"."user"'
        );
      });
    });

    describe('with the alias set', () => {
      it('returns an aliased table-name with the quoted alias', () => {
        sql.setAlias('foo');
        expect(sql.formatTable(), 'to be', '"user" AS "foo"');
      });

      describe('with `Model.schema` configured', () => {
        it('returns a quoted and aliased schema-qualified table-name', () => {
          const sql = new Sql(UserWithSchema).setAlias('foo');
          expect(sql.formatTable(), 'to be', '"public"."user" AS "foo"');
        });
      });
    });
  });

  describe('Sql.prototype.formatColumn', () => {
    it('returns a quoted non-qualified column', () => {
      expect(sql.formatColumn('id'), 'to be', '"id"');
    });

    describe('with custom columns configured', () => {
      let OtherUser;

      beforeEach(() => {
        OtherUser = class extends User {};
        OtherUser.fields = { id: { type: 'integer', column: 'ID' } };
      });

      it('uses the configured columns', () => {
        expect(new Sql(OtherUser).formatColumn('id'), 'to be', '"ID"');
      });
    });

    describe('with an unknown field-name', () => {
      it('throws an SqlError', () => {
        expect(
          () => sql.formatColumn({}),
          'to throw',
          new SqlError({
            sql,
            message: 'unknown field `[object Object]`'
          })
        );
      });
    });
  });

  describe('Sql.prototype.formatQuery', () => {
    it('returns a SELECT query wrapped in parentheses', () => {
      expect(sql.formatQuery(new Query(User)), 'to be', '(SELECT FROM "user")');
    });

    it('adds values from the query to its values array', () => {
      sql.formatQuery(new Query(User).setOption('where', { id: 1 }));
      expect(sql.getValues(), 'to equal', [1]);
    });

    it('adds fields from the query to its fields array', () => {
      sql.formatQuery(new Query(User).setOption('fields', ['id', 'name']));
      expect(sql.getFields(), 'to equal', ['id', 'name']);
    });
  });

  describe('Sql.prototype.formatRaw', () => {
    it("returns the part's SQL", () => {
      expect(
        sql.formatRaw(new SqlPart({ type: 'raw', value: { sql: 'SELECT 1' } })),
        'to be',
        'SELECT 1'
      );
    });

    it('supports raw SQL as a string', () => {
      expect(
        sql.formatRaw(new SqlPart({ type: 'raw', value: 'SELECT 1' })),
        'to be',
        'SELECT 1'
      );
    });

    it('adds values from the part to its values array', () => {
      sql.formatRaw(
        new SqlPart({ type: 'raw', value: { sql: 'SELECT ?', values: [1] } })
      );
      expect(sql.getValues(), 'to equal', [1]);
    });

    it('adds fields from the part to its fields array', () => {
      sql.formatRaw(
        new SqlPart({
          type: 'raw',
          value: { sql: 'SELECT 1 AS foo', fields: ['foo'] }
        })
      );
      expect(sql.getFields(), 'to equal', ['foo']);
    });
  });

  describe('Sql.prototype.formatValue', () => {
    it('returns a placeholder', () => {
      expect(sql.formatValue(1), 'to be', '?');
    });

    it('adds the value to its values array', () => {
      sql.formatValue(1);
      expect(sql.getValues(), 'to equal', [1]);
    });

    it('supports array values', () => {
      expect(sql.formatValue([1]), 'to be', '?');
      expect(sql.getValues(), 'to equal', [[1]]);
    });

    it('supports object values', () => {
      expect(sql.formatValue({ foo: 'bar' }), 'to be', '?');
      expect(sql.getValues(), 'to equal', [{ foo: 'bar' }]);
    });

    it('supports falsy values', () => {
      expect(sql.formatValue(false), 'to be', '?');
      expect(sql.getValues(), 'to equal', [false]);
    });

    it('throws an SqlError for `undefined`', () => {
      expect(
        () => sql.formatValue(),
        'to throw',
        new SqlError({
          sql,
          message: 'value is `undefined`'
        })
      );
      expect(
        () => sql.formatValue(undefined),
        'to throw',
        new SqlError({
          sql,
          message: 'value is `undefined`'
        })
      );
    });

    describe('for Query instances', () => {
      it("returns the Query's SELECT query", () => {
        expect(
          sql.formatValue(new Query(User)),
          'to be',
          '(SELECT FROM "user")'
        );
      });
    });

    describe('for SqlPart instances', () => {
      it("returns the part's SQL", () => {
        expect(
          sql.formatValue(
            new SqlPart({ type: 'raw', value: { sql: 'SELECT 1' } })
          ),
          'to be',
          'SELECT 1'
        );
      });
    });

    describe('with the `formatArray` formatter passed', () => {
      it('calls the function with array values', () => {
        const formatArray = sinon.spy();
        sql.formatValue([1], { formatArray });
        expect(formatArray, 'to have calls satisfying', () => formatArray([1]));
      });

      it("returns the function's return value", () => {
        expect(
          sql.formatValue([1], {
            formatArray() {
              return 'formatted value';
            }
          }),
          'to be',
          'formatted value'
        );
      });
    });

    describe('with the `formatObject` formatter passed', () => {
      it('calls the function with array values', () => {
        const formatObject = sinon.spy();
        sql.formatValue({ foo: 'bar' }, { formatObject });
        expect(formatObject, 'to have calls satisfying', () =>
          formatObject({ foo: 'bar' })
        );
      });

      it("returns the function's return value", () => {
        expect(
          sql.formatValue(
            { foo: 'bar' },
            {
              formatObject() {
                return 'formatted value';
              }
            }
          ),
          'to be',
          'formatted value'
        );
      });

      it('does not call the function with array values', () => {
        const formatObject = sinon.spy();
        sql.formatValue([1], { formatObject });
        expect(formatObject, 'was not called');
      });
    });

    describe('with the `formatValue` formatter passed', () => {
      it('calls the function with the value', () => {
        const formatValue = sinon.spy();
        sql.formatValue(false, { formatValue });
        expect(formatValue, 'to have calls satisfying', () =>
          formatValue(false)
        );
      });

      it('calls the function with object values', () => {
        const formatValue = sinon.spy();
        sql.formatValue({ foo: 'bar' }, { formatValue });
        expect(formatValue, 'to have calls satisfying', () =>
          formatValue({ foo: 'bar' })
        );
      });

      it('calls the function with array values', () => {
        const formatValue = sinon.spy();
        sql.formatValue([1], { formatValue });
        expect(formatValue, 'to have calls satisfying', () => formatValue([1]));
      });

      it('does not call the function for Query instances', () => {
        const formatValue = sinon.spy();
        sql.formatValue(new Query(User), { formatValue });
        expect(formatValue, 'was not called');
      });

      it('does not call the function for SqlPart instances', () => {
        const formatValue = sinon.spy();
        sql.formatValue(
          new SqlPart({ type: 'raw', value: { sql: 'SELECT 1' } }),
          { formatValue }
        );
        expect(formatValue, 'was not called');
      });

      it("returns the function's return value", () => {
        expect(
          sql.formatValue(1, {
            formatValue() {
              return 'formatted value';
            }
          }),
          'to be',
          'formatted value'
        );
      });
    });
  });

  describe('Sql.prototype.formatField', () => {
    it('returns a quoted table-name-qualified column', () => {
      expect(sql.formatField('id'), 'to be', '"user"."id"');
    });

    it('supports SqlPart instances', () => {
      expect(
        sql.formatField(
          new SqlPart({
            type: 'raw',
            value: { sql: 'COUNT(*)', fields: ['count'] }
          })
        ),
        'to be',
        'COUNT(*)'
      );
      expect(sql.getFields(), 'to equal', ['count']);
    });

    describe('with the alias set', () => {
      it('qualifies the column-name with the alias instead', () => {
        sql.setAlias('foo');
        expect(sql.formatField('id'), 'to be', '"foo"."id"');
      });
    });
  });

  describe('Sql.prototype.formatSelect', () => {
    it('returns a formatted `SELECT` clause with values and fields', () => {
      expect(
        sql.formatSelect(
          new SqlPart({
            type: 'select',
            value: [
              new SqlPart({
                type: 'fields',
                value: [
                  'id',
                  new SqlPart({
                    type: 'raw',
                    value: { sql: 'COUNT(*)', fields: ['count'] }
                  })
                ]
              }),
              new SqlPart({ type: 'from' }),
              new SqlPart({
                type: 'where',
                value: [{ id: 1 }]
              }),
              new SqlPart({ type: 'groupBy', value: ['id'] }),
              new SqlPart({
                type: 'having',
                value: [
                  new SqlPart({
                    type: 'greaterThan',
                    field: new SqlPart({
                      type: 'raw',
                      value: { sql: 'COUNT(*)' }
                    }),
                    value: 1
                  })
                ]
              }),
              new SqlPart({ type: 'orderBy', value: ['id'] }),
              new SqlPart({ type: 'limit', value: 10 }),
              new SqlPart({ type: 'offset', value: 0 })
            ]
          })
        ),
        'to be',
        [
          'SELECT "user"."id", COUNT(*) FROM "user" WHERE "user"."id" = ? ',
          'GROUP BY "user"."id" HAVING COUNT(*) > ? ORDER BY "user"."id" ',
          'LIMIT 10 OFFSET 0'
        ].join('')
      );
      expect(sql.getValues(), 'to equal', [1, 1]);
      expect(sql.getFields(), 'to equal', ['id', 'count']);
    });
  });

  describe('Sql.prototype.formatDistinct', () => {
    it('returns a `DISTINCT` clause', () => {
      expect(
        sql.formatDistinct(new SqlPart({ type: 'distinct' })),
        'to be',
        'DISTINCT'
      );
    });

    describe('with a part value set', () => {
      it('returns a `DISTINCT` clause with a formatted value', () => {
        expect(
          sql.formatDistinct(
            new SqlPart({
              type: 'distinct',
              value: new SqlPart({ type: 'fields', value: ['id', 'name'] })
            })
          ),
          'to be',
          'DISTINCT "user"."id", "user"."name"'
        );
      });
    });
  });

  describe('Sql.prototype.formatAll', () => {
    it('returns an `ALL` clause', () => {
      expect(sql.formatAll(new SqlPart({ type: 'all' })), 'to be', 'ALL');
    });

    describe('with a part value set', () => {
      it('returns an `ALL` clause with a formatted value', () => {
        expect(
          sql.formatAll(
            new SqlPart({
              type: 'all',
              value: new SqlPart({ type: 'fields', value: ['id', 'name'] })
            })
          ),
          'to be',
          'ALL "user"."id", "user"."name"'
        );
      });
    });
  });

  describe('Sql.prototype.formatFields', () => {
    it('returns a comma-separated list of formatted columns', () => {
      expect(
        sql.formatFields(
          new SqlPart({ type: 'fields', value: ['id', 'name'] })
        ),
        'to be',
        '"user"."id", "user"."name"'
      );
    });

    it('adds the field-names to its fields array', () => {
      sql.formatFields(new SqlPart({ type: 'fields', value: ['id', 'name'] }));
      expect(sql.getFields(), 'to equal', ['id', 'name']);
    });

    it('supports Query instances', () => {
      expect(
        sql.formatFields(
          new SqlPart({ type: 'fields', value: [new Query(User)] })
        ),
        'to be',
        '(SELECT FROM "user")'
      );
    });

    it('supports SqlPart instances', () => {
      expect(
        sql.formatFields(
          new SqlPart({
            type: 'fields',
            value: [new SqlPart({ type: 'raw', value: { sql: 'SELECT 1' } })]
          })
        ),
        'to be',
        'SELECT 1'
      );
    });

    describe('for objects', () => {
      it("returns a comma-separated list of formatted columns from the object's keys", () => {
        expect(
          sql.formatFields(
            new SqlPart({
              type: 'fields',
              value: [{ idAlias: 'id', nameAlias: 'name' }]
            })
          ),
          'to be',
          '"user"."id", "user"."name"'
        );
      });

      it("adds the object's keys to its fields array", () => {
        sql.formatFields(
          new SqlPart({
            type: 'fields',
            value: [{ idAlias: 'id', nameAlias: 'name' }]
          })
        );
        expect(sql.getFields(), 'to equal', ['idAlias', 'nameAlias']);
      });
    });
  });

  describe('Sql.prototype.formatFrom', () => {
    it('returns a `FROM` clause with a formatted table-name', () => {
      expect(sql.formatFrom(), 'to be', 'FROM "user"');
    });
  });

  describe('Sql.prototype.formatWhere', () => {
    it('returns a `WHERE` clause with formatted fields and values', () => {
      expect(
        sql.formatWhere(
          new SqlPart({
            type: 'where',
            value: [new SqlPart({ type: 'equalTo', field: 'id', value: 1 })]
          })
        ),
        'to be',
        'WHERE "user"."id" = ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });

    it('formats multiple values with an `AND` clause', () => {
      expect(
        sql.formatWhere(
          new SqlPart({
            type: 'where',
            value: [
              true,
              new SqlPart({ type: 'equalTo', field: 'id', value: 1 })
            ]
          })
        ),
        'to be',
        'WHERE (? AND "user"."id" = ?)'
      );
      expect(sql.getValues(), 'to equal', [true, 1]);
    });

    it('supports falsy values', () => {
      expect(
        sql.formatWhere(new SqlPart({ type: 'where', value: [false] })),
        'to be',
        'WHERE ?'
      );
      expect(sql.getValues(), 'to equal', [false]);
    });

    it('supports Query instance values', () => {
      expect(
        sql.formatWhere(
          new SqlPart({
            type: 'where',
            value: [
              new Query(User).setOptions({
                fields: [
                  new SqlPart({
                    type: 'raw',
                    value: { sql: '?', values: [true] }
                  })
                ]
              })
            ]
          })
        ),
        'to be',
        'WHERE (SELECT ? FROM "user")'
      );
      expect(sql.getValues(), 'to equal', [true]);
    });
  });

  describe('Sql.prototype.formatNot', () => {
    it('returns a `NOT` clause with a formatted value', () => {
      expect(
        sql.formatNot(new SqlPart({ type: 'not', value: true })),
        'to be',
        'NOT ?'
      );
      expect(sql.getValues(), 'to equal', [true]);
    });
  });

  describe('Sql.prototype.formatAny', () => {
    it('returns an `ANY` clause with a formatted value', () => {
      expect(
        sql.formatAny(new SqlPart({ type: 'any', value: new Query(User) })),
        'to be',
        'ANY (SELECT FROM "user")'
      );
      expect(sql.getValues(), 'to equal', []);
    });
  });

  describe('Sql.prototype.formatSome', () => {
    it('returns a `SOME` clause with a formatted value', () => {
      expect(
        sql.formatSome(new SqlPart({ type: 'some', value: new Query(User) })),
        'to be',
        'SOME (SELECT FROM "user")'
      );
      expect(sql.getValues(), 'to equal', []);
    });
  });

  describe('Sql.prototype.formatExists', () => {
    it('returns an `EXISTS` clause with a formatted value', () => {
      expect(
        sql.formatExists(
          new SqlPart({ type: 'exists', value: new Query(User) })
        ),
        'to be',
        'EXISTS (SELECT FROM "user")'
      );
      expect(sql.getValues(), 'to equal', []);
    });
  });

  describe('Sql.prototype.formatEqualTo', () => {
    it('returns an `=` condition with a formatted field and value', () => {
      expect(
        sql.formatEqualTo(
          new SqlPart({ type: 'equalTo', field: 'id', value: 1 })
        ),
        'to be',
        '"user"."id" = ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });
  });

  describe('Sql.prototype.formatNotEqualTo', () => {
    it('returns a `<>` condition with a formatted field and value', () => {
      expect(
        sql.formatNotEqualTo(
          new SqlPart({ type: 'notEqualTo', field: 'id', value: 1 })
        ),
        'to be',
        '"user"."id" <> ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });
  });

  describe('Sql.prototype.formatGreaterThan', () => {
    it('returns a `>` condition with a formatted field and value', () => {
      expect(
        sql.formatGreaterThan(
          new SqlPart({ type: 'greaterThan', field: 'id', value: 1 })
        ),
        'to be',
        '"user"."id" > ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });
  });

  describe('Sql.prototype.formatGreaterThanOrEqualTo', () => {
    it('returns a `>=` condition with a formatted field and value', () => {
      expect(
        sql.formatGreaterThanOrEqualTo(
          new SqlPart({ type: 'greaterThanOrEqualTo', field: 'id', value: 1 })
        ),
        'to be',
        '"user"."id" >= ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });
  });

  describe('Sql.prototype.formatLessThan', () => {
    it('returns a `<` condition with a formatted field and value', () => {
      expect(
        sql.formatLessThan(
          new SqlPart({ type: 'lessThan', field: 'id', value: 1 })
        ),
        'to be',
        '"user"."id" < ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });
  });

  describe('Sql.prototype.formatLessThanOrEqualTo', () => {
    it('returns a `<=` condition with a formatted field and value', () => {
      expect(
        sql.formatLessThanOrEqualTo(
          new SqlPart({ type: 'lessThanOrEqualTo', field: 'id', value: 1 })
        ),
        'to be',
        '"user"."id" <= ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });
  });

  describe('Sql.prototype.formatIsNull', () => {
    it('returns an `IS NULL` condition with a formatted field', () => {
      expect(
        sql.formatIsNull(new SqlPart({ type: 'isNull', field: 'id' })),
        'to be',
        '"user"."id" IS NULL'
      );
      expect(sql.getValues(), 'to equal', []);
    });
  });

  describe('Sql.prototype.formatIsNotNull', () => {
    it('returns an `IS NOT NULL` condition with a formatted field', () => {
      expect(
        sql.formatIsNotNull(new SqlPart({ type: 'isNotNull', field: 'id' })),
        'to be',
        '"user"."id" IS NOT NULL'
      );
      expect(sql.getValues(), 'to equal', []);
    });
  });

  describe('Sql.prototype.formatLike', () => {
    it('returns an `LIKE` condition with a formatted field and value', () => {
      expect(
        sql.formatLike(
          new SqlPart({ type: 'like', field: 'name', value: 'foo' })
        ),
        'to be',
        '"user"."name" LIKE ?'
      );
      expect(sql.getValues(), 'to equal', ['foo']);
    });
  });

  describe('Sql.prototype.formatBetween', () => {
    it('returns an `BETWEEN` condition with a formatted field and value', () => {
      expect(
        sql.formatBetween(
          new SqlPart({ type: 'between', field: 'id', value: [1, 2] })
        ),
        'to be',
        '"user"."id" BETWEEN ? AND ?'
      );
      expect(sql.getValues(), 'to equal', [1, 2]);
    });
  });

  describe('Sql.prototype.formatIn', () => {
    it('returns an `IN` condition with a formatted field and value', () => {
      expect(
        sql.formatIn(
          new SqlPart({ type: 'in', field: 'id', value: [1, 2, 3] })
        ),
        'to be',
        '"user"."id" IN (?, ?, ?)'
      );
      expect(sql.getValues(), 'to equal', [1, 2, 3]);
    });

    it('converts the clause to `IN (null)` for empty arrays', () => {
      expect(
        sql.formatIn(new SqlPart({ type: 'in', field: 'id', value: [] })),
        'to be',
        '"user"."id" IN (?)'
      );
      expect(sql.getValues(), 'to equal', [null]);
    });
  });

  describe('Sql.prototype.formatAndOrOr', () => {
    it('returns an `AND` clause for `and` parts', () => {
      expect(
        sql.formatAndOrOr(new SqlPart({ type: 'and', value: [true, true] })),
        'to be',
        '(? AND ?)'
      );
      expect(sql.getValues(), 'to equal', [true, true]);
    });

    it('returns an `OR` clause for `or` parts', () => {
      expect(
        sql.formatAndOrOr(new SqlPart({ type: 'or', value: [true, false] })),
        'to be',
        '(? OR ?)'
      );
      expect(sql.getValues(), 'to equal', [true, false]);
    });

    it('supports non-array values', () => {
      expect(
        sql.formatAndOrOr(new SqlPart({ type: 'or', value: true })),
        'to be',
        '?'
      );
      expect(sql.getValues(), 'to equal', [true]);
    });

    describe('for object values', () => {
      it('returns an `AND` clause for all the object entries', () => {
        expect(
          sql.formatAndOrOr(
            new SqlPart({
              type: 'or',
              value: [{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }]
            })
          ),
          'to be',
          [
            '(("user"."id" = ? AND "user"."name" = ?) OR ',
            '("user"."id" = ? AND "user"."name" = ?))'
          ].join('')
        );
        expect(sql.getValues(), 'to equal', [1, 'foo', 2, 'bar']);
      });
    });
  });

  describe('Sql.prototype.formatAnd', () => {
    it('returns an `AND` clause with formatted values', () => {
      expect(
        sql.formatAnd(new SqlPart({ type: 'and', value: [true, true] })),
        'to be',
        '(? AND ?)'
      );
      expect(sql.getValues(), 'to equal', [true, true]);
    });
  });

  describe('Sql.prototype.formatOr', () => {
    it('returns an `OR` clause with formatted values', () => {
      expect(
        sql.formatOr(new SqlPart({ type: 'or', value: [true, false] })),
        'to be',
        '(? OR ?)'
      );
      expect(sql.getValues(), 'to equal', [true, false]);
    });
  });

  describe('Sql.prototype.formatGroupBy', () => {
    it('returns a `GROUP BY` clause with a formatted field', () => {
      expect(
        sql.formatGroupBy(new SqlPart({ type: 'groupBy', value: ['id'] })),
        'to be',
        'GROUP BY "user"."id"'
      );
    });

    it('returns a list of formatted fields for multiple fields', () => {
      expect(
        sql.formatGroupBy(
          new SqlPart({ type: 'where', value: ['id', 'name'] })
        ),
        'to be',
        'GROUP BY "user"."id", "user"."name"'
      );
    });
  });

  describe('Sql.prototype.formatHaving', () => {
    it('returns a `HAVING` clause with formatted fields and values', () => {
      expect(
        sql.formatHaving(
          new SqlPart({
            type: 'having',
            value: new SqlPart({ type: 'greaterThan', field: 'id', value: 1 })
          })
        ),
        'to be',
        'HAVING "user"."id" > ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });

    it('formats array values with an `AND` clause', () => {
      expect(
        sql.formatHaving(
          new SqlPart({
            type: 'having',
            value: [
              new SqlPart({ type: 'equalTo', field: 'id', value: 1 }),
              new SqlPart({
                type: 'greaterThan',
                field: new SqlPart({ type: 'raw', value: { sql: 'COUNT(*)' } }),
                value: 1
              })
            ]
          })
        ),
        'to be',
        'HAVING ("user"."id" = ? AND COUNT(*) > ?)'
      );
      expect(sql.getValues(), 'to equal', [1, 1]);
    });
  });

  describe('Sql.prototype.formatOrderBy', () => {
    it('returns a `ORDER BY` clause with a formatted field', () => {
      expect(
        sql.formatOrderBy(new SqlPart({ type: 'orderBy', value: ['id'] })),
        'to be',
        'ORDER BY "user"."id"'
      );
    });

    it('returns a list of formatted fields for array values', () => {
      expect(
        sql.formatOrderBy(
          new SqlPart({ type: 'orderBy', value: ['id', 'name'] })
        ),
        'to be',
        'ORDER BY "user"."id", "user"."name"'
      );
    });

    it('supports ordering by a column reference', () => {
      expect(
        sql.formatOrderBy(new SqlPart({ type: 'orderBy', value: [1] })),
        'to be',
        'ORDER BY ?'
      );
      expect(sql.getValues(), 'to equal', [1]);
    });

    describe('for object values', () => {
      it('formats a 1 object value into an `ASC` clause', () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({ type: 'orderBy', value: [{ id: 1 }] })
          ),
          'to be',
          'ORDER BY "user"."id" ASC'
        );
      });

      it('formats a -1 object value into an `DESC` clause', () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({ type: 'orderBy', value: [{ id: -1 }] })
          ),
          'to be',
          'ORDER BY "user"."id" DESC'
        );
      });

      it("formats an 'asc' object value into an `ASC` clause", () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({ type: 'orderBy', value: [{ id: 'asc' }] })
          ),
          'to be',
          'ORDER BY "user"."id" ASC'
        );
      });

      it("formats a 'DESC' object value into an `DESC` clause", () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({ type: 'orderBy', value: [{ id: 'DESC' }] })
          ),
          'to be',
          'ORDER BY "user"."id" DESC'
        );
      });

      it("formats an 'asc' object value into an `ASC` clause", () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({ type: 'orderBy', value: [{ id: 'asc' }] })
          ),
          'to be',
          'ORDER BY "user"."id" ASC'
        );
      });

      it("formats a 'DESC' object value into an `DESC` clause", () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({ type: 'orderBy', value: [{ id: 'DESC' }] })
          ),
          'to be',
          'ORDER BY "user"."id" DESC'
        );
      });

      it('supports SqlPart values', () => {
        expect(
          sql.formatOrderBy(
            new SqlPart({
              type: 'orderBy',
              value: [
                {
                  id: new SqlPart({
                    type: 'asc',
                    value: new SqlPart({
                      type: 'nulls',
                      value: new SqlPart({ type: 'last' })
                    })
                  })
                }
              ]
            })
          ),
          'to be',
          'ORDER BY "user"."id" ASC NULLS LAST'
        );
      });
    });
  });

  describe('Sql.prototype.formatAsc', () => {
    it('returns an `ASC` clause', () => {
      expect(sql.formatAsc(new SqlPart({ type: 'asc' })), 'to be', 'ASC');
    });

    describe('with a part value set', () => {
      it('returns an `ASC` clause with a formatted value', () => {
        expect(
          sql.formatAsc(
            new SqlPart({
              type: 'asc',
              value: new SqlPart({ type: 'raw', value: { sql: 'NULLS FIRST' } })
            })
          ),
          'to be',
          'ASC NULLS FIRST'
        );
      });
    });
  });

  describe('Sql.prototype.formatDesc', () => {
    it('returns a `DESC` clause', () => {
      expect(sql.formatDesc(new SqlPart({ type: 'desc' })), 'to be', 'DESC');
    });

    describe('with a part value set', () => {
      it('returns a `DESC` clause with a formatted value', () => {
        expect(
          sql.formatDesc(
            new SqlPart({
              type: 'desc',
              value: new SqlPart({ type: 'raw', value: { sql: 'NULLS LAST' } })
            })
          ),
          'to be',
          'DESC NULLS LAST'
        );
      });
    });
  });

  describe('Sql.prototype.formatNulls', () => {
    it('returns a `NULLS` clause', () => {
      expect(
        sql.formatNulls(
          new SqlPart({ type: 'nulls', value: new SqlPart({ type: 'first' }) })
        ),
        'to be',
        'NULLS FIRST'
      );
    });
  });

  describe('Sql.prototype.formatFirst', () => {
    it('returns a `FIRST` clause', () => {
      expect(sql.formatFirst(new SqlPart({ type: 'first' })), 'to be', 'FIRST');
    });
  });

  describe('Sql.prototype.formatLast', () => {
    it('returns a `LAST` clause', () => {
      expect(sql.formatLast(new SqlPart({ type: 'last' })), 'to be', 'LAST');
    });
  });

  describe('Sql.prototype.formatLimitOrOffset', () => {
    it('returns a `LIMIT` clause for `limit` parts', () => {
      expect(
        sql.formatLimitOrOffset(new SqlPart({ type: 'limit', value: 10 })),
        'to be',
        'LIMIT 10'
      );
    });

    it('returns a `OFFSET` clause for `offset` parts', () => {
      expect(
        sql.formatLimitOrOffset(new SqlPart({ type: 'offset', value: 10 })),
        'to be',
        'OFFSET 10'
      );
    });

    it('supports `0`', () => {
      expect(
        sql.formatLimitOrOffset(new SqlPart({ type: 'offset', value: 0 })),
        'to be',
        'OFFSET 0'
      );
    });

    it('casts string values to integers', () => {
      expect(
        sql.formatLimitOrOffset(new SqlPart({ type: 'limit', value: '10' })),
        'to be',
        'LIMIT 10'
      );
    });

    it('throws an SqlError if the value is not (or cannot be cast to) an integer', () => {
      expect(
        () =>
          sql.formatLimitOrOffset(
            new SqlPart({ type: 'offset', value: 'foo' })
          ),
        'to throw',
        new SqlError({
          sql,
          message: 'value for OFFSET should be an integer'
        })
      );
    });
  });

  describe('Sql.prototype.formatLimit', () => {
    it('returns a `LIMIT` clause', () => {
      expect(
        sql.formatLimit(new SqlPart({ type: 'limit', value: 10 })),
        'to be',
        'LIMIT 10'
      );
    });
  });

  describe('Sql.prototype.formatOffset', () => {
    it('returns a `OFFSET` clause', () => {
      expect(
        sql.formatOffset(new SqlPart({ type: 'offset', value: 10 })),
        'to be',
        'OFFSET 10'
      );
    });
  });

  describe('Sql.raw', () => {
    it('returns a new `raw` part', () => {
      expect(
        Sql.raw({ sql: 'SELECT 1' }),
        'to equal',
        new SqlPart({ type: 'raw', value: { sql: 'SELECT 1' } })
      );
    });
  });

  describe('Sql.select', () => {
    it('returns a `select` part', () => {
      expect(
        Sql.select([new SqlPart({ type: 'from' })]),
        'to equal',
        new SqlPart({ type: 'select', value: [new SqlPart({ type: 'from' })] })
      );
    });
  });

  describe('Sql.distinct', () => {
    it('returns a new `distinct` part', () => {
      expect(
        Sql.distinct(new Query(User)),
        'to equal',
        new SqlPart({ type: 'distinct', value: new Query(User) })
      );
    });
  });

  describe('Sql.all', () => {
    it('returns a new `all` part', () => {
      expect(
        Sql.all(new Query(User)),
        'to equal',
        new SqlPart({ type: 'all', value: new Query(User) })
      );
    });
  });

  describe('Sql.fields', () => {
    it('returns a new `fields` part', () => {
      expect(
        Sql.fields(['id']),
        'to equal',
        new SqlPart({ type: 'fields', value: ['id'] })
      );
    });
  });

  describe('Sql.from', () => {
    it('returns a new `from` part', () => {
      expect(Sql.from(), 'to equal', new SqlPart({ type: 'from' }));
    });
  });

  describe('Sql.where', () => {
    it('returns a new `where` part', () => {
      expect(
        Sql.where({ id: 1 }),
        'to equal',
        new SqlPart({ type: 'where', value: { id: 1 } })
      );
    });
  });

  describe('Sql.not', () => {
    it('returns a new `not` part', () => {
      expect(
        Sql.not(false),
        'to equal',
        new SqlPart({ type: 'not', value: false })
      );
    });
  });

  describe('Sql.any', () => {
    it('returns a new `any` part', () => {
      expect(
        Sql.any(new Query(User)),
        'to equal',
        new SqlPart({ type: 'any', value: new Query(User) })
      );
    });
  });

  describe('Sql.some', () => {
    it('returns a new `some` part', () => {
      expect(
        Sql.some(new Query(User)),
        'to equal',
        new SqlPart({ type: 'some', value: new Query(User) })
      );
    });
  });

  describe('Sql.exists', () => {
    it('returns a new `exists` part', () => {
      expect(
        Sql.exists(new Query(User)),
        'to equal',
        new SqlPart({ type: 'exists', value: new Query(User) })
      );
    });
  });

  describe('Sql.equalTo', () => {
    it('returns a new `equalTo` part', () => {
      expect(
        Sql.equalTo('id', 1),
        'to equal',
        new SqlPart({ type: 'equalTo', field: 'id', value: 1 })
      );
    });
  });

  describe('Sql.notEqualTo', () => {
    it('returns a new `notEqualTo` part', () => {
      expect(
        Sql.notEqualTo('id', 1),
        'to equal',
        new SqlPart({ type: 'notEqualTo', field: 'id', value: 1 })
      );
    });
  });

  describe('Sql.greaterThan', () => {
    it('returns a new `greaterThan` part', () => {
      expect(
        Sql.greaterThan('id', 1),
        'to equal',
        new SqlPart({ type: 'greaterThan', field: 'id', value: 1 })
      );
    });
  });

  describe('Sql.greaterThanOrEqualTo', () => {
    it('returns a new `greaterThanOrEqualTo` part', () => {
      expect(
        Sql.greaterThanOrEqualTo('id', 1),
        'to equal',
        new SqlPart({ type: 'greaterThanOrEqualTo', field: 'id', value: 1 })
      );
    });
  });

  describe('Sql.lessThan', () => {
    it('returns a new `lessThan` part', () => {
      expect(
        Sql.lessThan('id', 1),
        'to equal',
        new SqlPart({ type: 'lessThan', field: 'id', value: 1 })
      );
    });
  });

  describe('Sql.lessThanOrEqualTo', () => {
    it('returns a new `lessThanOrEqualTo` part', () => {
      expect(
        Sql.lessThanOrEqualTo('id', 1),
        'to equal',
        new SqlPart({ type: 'lessThanOrEqualTo', field: 'id', value: 1 })
      );
    });
  });

  describe('Sql.isNull', () => {
    it('returns a new `isNull` part', () => {
      expect(
        Sql.isNull('id'),
        'to equal',
        new SqlPart({ type: 'isNull', field: 'id' })
      );
    });
  });

  describe('Sql.isNotNull', () => {
    it('returns a new `isNotNull` part', () => {
      expect(
        Sql.isNotNull('id'),
        'to equal',
        new SqlPart({ type: 'isNotNull', field: 'id' })
      );
    });
  });

  describe('Sql.like', () => {
    it('returns a new `like` part', () => {
      expect(
        Sql.like('name', 'foo'),
        'to equal',
        new SqlPart({ type: 'like', field: 'name', value: 'foo' })
      );
    });
  });

  describe('Sql.between', () => {
    it('returns a new `between` part', () => {
      expect(
        Sql.between('id', [1, 3]),
        'to equal',
        new SqlPart({ type: 'between', field: 'id', value: [1, 3] })
      );
    });
  });

  describe('Sql.in', () => {
    it('returns a new `in` part', () => {
      expect(
        Sql.in('name', ['foo', 'bar']),
        'to equal',
        new SqlPart({ type: 'in', field: 'name', value: ['foo', 'bar'] })
      );
    });
  });

  describe('Sql.and', () => {
    it('returns a new `and` part', () => {
      expect(
        Sql.and([{ id: 1 }, { id: 2 }]),
        'to equal',
        new SqlPart({ type: 'and', value: [{ id: 1 }, { id: 2 }] })
      );
    });
  });

  describe('Sql.or', () => {
    it('returns a new `or` part', () => {
      expect(
        Sql.or([{ id: 1 }, { id: 2 }]),
        'to equal',
        new SqlPart({ type: 'or', value: [{ id: 1 }, { id: 2 }] })
      );
    });
  });

  describe('Sql.groupBy', () => {
    it('returns a new `groupBy` part', () => {
      expect(
        Sql.groupBy(['id']),
        'to equal',
        new SqlPart({ type: 'groupBy', value: ['id'] })
      );
    });
  });

  describe('Sql.having', () => {
    it('returns a new `having` part', () => {
      expect(
        Sql.having({ id: 1 }),
        'to equal',
        new SqlPart({ type: 'having', value: { id: 1 } })
      );
    });
  });

  describe('Sql.orderBy', () => {
    it('returns a new `orderBy` part', () => {
      expect(
        Sql.orderBy(['id']),
        'to equal',
        new SqlPart({ type: 'orderBy', value: ['id'] })
      );
    });
  });

  describe('Sql.asc', () => {
    it('returns a new `asc` part', () => {
      expect(Sql.asc(), 'to equal', new SqlPart({ type: 'asc' }));
    });
  });

  describe('Sql.desc', () => {
    it('returns a new `desc` part', () => {
      expect(Sql.desc(), 'to equal', new SqlPart({ type: 'desc' }));
    });
  });

  describe('Sql.nulls', () => {
    it('returns a new `nulls` part', () => {
      expect(Sql.nulls(), 'to equal', new SqlPart({ type: 'nulls' }));
    });
  });

  describe('Sql.first', () => {
    it('returns a new `first` part', () => {
      expect(Sql.first(), 'to equal', new SqlPart({ type: 'first' }));
    });
  });

  describe('Sql.last', () => {
    it('returns a new `last` part', () => {
      expect(Sql.last(), 'to equal', new SqlPart({ type: 'last' }));
    });
  });

  describe('Sql.limit', () => {
    it('returns a new `limit` part', () => {
      expect(
        Sql.limit(10),
        'to equal',
        new SqlPart({ type: 'limit', value: 10 })
      );
    });
  });

  describe('Sql.offset', () => {
    it('returns a new `offset` part', () => {
      expect(
        Sql.offset(10),
        'to equal',
        new SqlPart({ type: 'offset', value: 10 })
      );
    });
  });

  describe('Sql.insert', () => {
    it('returns a `insert` part', () => {
      expect(
        Sql.insert([new SqlPart({ type: 'into' })]),
        'to equal',
        new SqlPart({ type: 'insert', value: [new SqlPart({ type: 'into' })] })
      );
    });
  });

  describe('Sql.into', () => {
    it('returns a new `into` part', () => {
      expect(Sql.into(), 'to equal', new SqlPart({ type: 'into' }));
    });
  });

  describe('Sql.columns', () => {
    it('returns a new `columns` part', () => {
      expect(
        Sql.columns(['id']),
        'to equal',
        new SqlPart({ type: 'columns', value: ['id'] })
      );
    });
  });

  describe('Sql.values', () => {
    it('returns a new `values` part', () => {
      expect(
        Sql.values([[1]]),
        'to equal',
        new SqlPart({ type: 'values', value: [[1]] })
      );
    });
  });

  describe('Sql.returning', () => {
    it('returns a new `returning` part', () => {
      expect(
        Sql.returning(['id']),
        'to equal',
        new SqlPart({ type: 'returning', value: ['id'] })
      );
    });
  });
});
