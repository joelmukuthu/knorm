# Models

Models are synonymous to database tables. They provide the core functionality
for setting, getting, validating, casting, saving, updating and deleting data.
All models inherit the base [Model](/api.md#model) class.

## Model config

Models are configured through these static properties:

| Property         | Type                        | Default                     | Description                                                                                                                                                                   |
| ---------------- | --------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Model.table`    | string (**required**)       | none                        | Configures the model's table-name. **NOTE:** this config can be omitted if the model is not used for performing any database operations (i.e. fetching, saving, deleting etc) |
| `Model.schema`   | string                      | none                        | Configures the model's schema-name                                                                                                                                            |
| `Model.fields`   | object                      | none                        | Configures the model's fields. See the [fields guide](/guides/fields.md#fields) for more info                                                                                  |
| `Model.virtuals` | object                      | none                        | Configures the model's virtual fields. See the [virtuals guide](/guides/virtuals.md#virtuals) for more info                                                                    |
| `Model.options`  | object                      | none                        | Configures the model's default query and plugin options (for some plugins). See [customizing queries per model](#customizing-queries-per-model) for more info                 |
| `Model.Query`    | [Query](/api.md#query) | [Query](/api.md#query) | The `Query` class that the model uses to perform database operations. This allows [customizing queries per model](#customizing-queries-per-model).                            |
| `Model.Field`    | [Field](/api.md#field) | [Field](/api.md#field) | The `Field` class that the model uses to create field instances. Also allows customizing fields per model.                                                                    |

## Setting data

Assuming this model:

```js
class User extends Model {}

User.fields = { firstName: { type: 'string' }, lastName: { type: 'string' } };
User.virtuals = {
  names: {
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
    set(names) {
      names = names.split(' ');
      this.firstName = names[0];
      this.lastName = names[1];
    }
  }
};
```

You can set data on the model instance in any of the following ways:

```js
// constructor:
const user = new User({ firstName: 'Foo', lastName: 'Bar' });

// setData:
const user = new User().setData({ firstName: 'Foo', lastName: 'Bar' });

// assignment:
const user = new User();
user.firstName = 'Foo';
user.lastName = 'Bar';
```

Setting data via virtuals is also supported:

```js
// constructor:
const user = new User({ names: 'Foo Bar' });

// setData:
const user = new User().setData({ names: 'Foo Bar' });

// assignment:
const user = new User();
user.names = 'Foo Bar';
```

> See the [Model](/api.md#model) docs for more info

## Getting data

Following the example in [Setting data](#setting-data), you can get data set on
the instance via:

```js
// direct property access:
console.log(user.firstName); // => 'Foo'
console.log(user.lastName); // => 'Bar'
console.log(user.names); // => 'Foo Bar'

// to get only field data:
user.getFieldData(); // { firstName: 'Foo', lastName: 'Bar' }
// to get virtual data syncronously:
user.getVirtualDataSync(); // { names: 'Foo Bar' }
// to get both field and virtual data syncronously:
user.getDataSync(); // { firstName: 'Foo', lastName: 'Bar', names: 'Foo Bar' }

// with async virtuals:
user.getVirtualData(); // Promise => { names: 'Foo Bar' }
user.getData(); // Promise => { firstName: 'Foo', lastName: 'Bar', names: 'Foo Bar' }
```

::: tip INFO
Since `async` virtual getters are intrinsically supported, the methods that get
virtual field data always return a `Promise`. However, you can stil use the
sync variants to ignore async virtual data.
:::

## Saving, fetching and deleting data

For all [Model](/api.md#model) instances, you can save, retrieve or delete
data in the database with these methods:

```js
// either insert or update (if the instance has a primary field-value set):
user.save(options);

// or directly call:
user.insert(options);
user.update(options);

// fetch or re-fetch:
user.fetch(options);

// delete:
user.delete(options);
```

> See [model.save](/api.md#model-save-options-%E2%87%92-promise-model),
> [model.insert](/api.md#model-insert-options-%E2%87%92-promise-model),
> [model.update](/api.md#model-update-options-%E2%87%92-promise-model),
> [model.fetch](/api.md#model-fetch-options-%E2%87%92-promise-model) and
> [model.delete](/api.md#model-delete-options-%E2%87%92-promise-model) for more
> info

All the methods update the instance with the latest data from the database, so
after an update you do not need to re-fetch the row (this can be disabled with
the [returning](/api.md#query-returning-fields-%E2%87%92-query) query option
though).

The [model.update](/api.md#model-update-options-%E2%87%92-promise-model),
[model.fetch](/api.md#model-fetch-options-%E2%87%92-promise-model) and
[model.delete](/api.md#model-delete-options-%E2%87%92-promise-model) methods
require a primary or unique field to be set on the model in order to find the
row in the database. See the
[primary and unique fields guide](/guides/field.md#primary-and-unique-fields)
for more info.

All the methods also have static variants that instead enable working with
multiple records:

```js
// insert multiple records:
User.save([user1, user2], options);
User.insert([user1, user2], options);

// update multiple records:
User.update({ firstName: 'Bar' }, options);

// fetch all records:
User.fetch(options);

// delete all records:
User.delete(options);
```

> See [Model.save](/api.md#model-save-data-options-%E2%87%92-promise),
> [Model.insert](/api.md#model-insert-data-options-%E2%87%92-promise),
> [Model.update](/api.md#model-update-data-options-%E2%87%92-promise),
> [Model.fetch](/api.md#model-fetch-data-options-%E2%87%92-promise) and
> [Model.delete](/api.md#model-delete-data-options-%E2%87%92-promise) for more
> info

::: tip INFO
Static methods work on multiple rows while the instance methods only work on
a single row!
:::

::: warning NOTE
Instance methods will automatically throw an error if the record is not found
in the database (for fetch, delete and update operations).
:::

In addition, you can configure [generated
methods](/guides/fields.md#generated-methods)
with the `methods` [field config option](/guides/fields.md#field-config):

```js
User.fields = { email: { type: 'email', unique: true, methods: true } };

User.fetchByEmail('foo@bar.com', options);
User.updateByEmail('foo@bar.com', data, options);
User.deleteByEmail('foo@bar.com', options);
```

::: warning NOTE
These methods also throw an error if the record is not found in the database
since they are intended to work with single records.
:::

## Customizing queries per model

You can set default query options per model via the
[Model.options](/api.md#Model.fields) setter.

For example, if your users table has some system users that should not be
fetched/updated/deleted, you can add a default
[where](/api.md#query-where-fields-%E2%87%92-query) option:

```js
class User extends Model {}

User.fields = {
  id: { type: 'integer', primary: true },
  type: { type: 'string', default: 'user', oneOf: ['system', 'user'] }
};

User.options = {
  query: { where: User.where.notEqual({ type: 'system' }) }
};

User.fetch().then(console.log); // will not contain system users
```

::: tip INFO
These options will also be inherited when the model is inherited. <br />
Read more on [setting query options](/guides/queries.md#setting-options)
:::

You could then have a `SystemUser` model for interacting only with system users:

```js
class SystemUser extends User {}

SystemUser.options = {
  query: { where: { type: 'system' } }
};

SystemUser.fetch().then(console.log); // will only contain system users
```

For more fine-grained control, you can also override the `Query` class and add
custom query options:

```js
class User extends Model {}

User.Query = class UserQuery extends User.Query {
  onlySystemUsers() {
    return this.where({ type: 'system' });
  }

  withoutSystemUsers() {
    const where = this.constructor.where;
    return this.where(where.notEqual({ type: 'system' }));
  }

  withSystemUsers() {
    return this; // doesn't need to do anything, should return all users
  }
};

User.fetch({
  onlySystemUsers: true
}).then(console.log); // will only contain system users
```

::: warning NOTE
Query options should return `this` to allow chaining.
:::

## Model registry

Knorm keeps an internal registry of models that is automatically updated when
models are created and configured. In any of Knorm's classes, the model registry
can be accessed via the `models` object:

```js
const knorm = require('@knorm/knorm');
const orm = knorm();

class User extends orm.Model {
  doStuff() {
    console.log(this.models); // => { User: [Function: User] }
  }
}

User.table = 'user';

console.log(User.models); // => { User: [Function: User] }
console.log(orm.models); // => { User: [Function: User] }
```

When accessing other models from within instance and class methods, it's
recommended to use the `models` instance or class property, rather than
accessing them via Node's `require` function. This allows [runnning queries
within transactions](/guides/transactions.md#nested-queries-in-instance-or-class-methods)
without having to make any further code changes.

Note that for models to be automatically added to the registry, they must be
loaded (i.e. `require`d) and [configured](#model-config). If a model is not
configured, you can add it to the registry via
[addModel](/api.md#knorm-addmodel-model):

```js
const knorm = require('@knorm/knorm');
const orm = knorm();

class User extends orm.Model {}
class Admin extends User {}

User.table = 'user'; // User is configured, added automatically

orm.addModel(Admin); // Admin is not configured, must be added manually
```

Since models are only automatically added when they are `require`d, it's
recommended to load all the models syncronously when starting up a node app.
For example:

```js
// app.js:
const express = require('express');
const loadModels = require('./models');
const app = express();

loadModels();

app.get('/', (req, res) => res.send('Hello World!'));
app.listen(3000, () => console.log('Example app listening on port 3000!'));
```

```js
// models/index.js:
const orm = require('./orm');
const { readdirSync } = require('fs');
const { resolve, basename } = require('path');

const modelsDir = resolve(__dirname);
const loadModels = () => {
  readdirSync(modelsDir).forEach(filename => {
    const modelName = basename(filename, '.js');
    // require the model, automatically loads it into the orm:
    const model = require(resolve(modelsDir, filename));
    // if the model is not configured, manually add it to the orm:
    if (!orm.models[modelName]) {
      orm.addModel(model);
    }
  });
};

module.exports = loadModels;
```

```js
// models/orm.js:
const knorm = require('@knorm/knorm');
const orm = knorm();

module.exports = orm;
```

```js
// models/User.js:
const orm = require('./orm');

class User extends orm.Model {}
User.table = 'user';

module.exports = User;
```

```js
// models/Admin.js:
const User = require('./User');

class Admin extends User {}

module.exports = Admin;
```
