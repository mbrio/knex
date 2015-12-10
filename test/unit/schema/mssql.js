/*global describe, expect, it*/

'use strict';

var MSSQL_Client  = require('../../../lib/dialects/mssql');
var client = new MSSQL_Client();

describe("MSSQL SchemaBuilder", function() {

  var tableSql;
  var equal = require('assert').equal;

  it('test basic create table with charset and collate', function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.increments('id');
      table.string('email');
      table.charset('utf8');
      table.collate('utf8_unicode_ci');
    });

    equal(1, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal('create table [users] ([id] int identity(1,1) not null primary key, [email] nvarchar(255))');
    expect(tableSql.toQuery()).to.equal('create table [users] ([id] int identity(1,1) not null primary key, [email] nvarchar(255))');
  });

  it('basic create table without charset or collate', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.increments('id');
      this.string('email');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [id] int identity(1,1) not null primary key, add [email] nvarchar(255)');
  });

  it('test drop table', function() {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table [users]');
  });

  it('test drop table if exists', function() {
    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal("if object_id('[users]', 'U') is not null drop table [users]");
  });

  it('test drop column', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop column [foo]');
  });

  it('drops multiple columns with an array', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn(['foo', 'bar']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop column [foo], drop column [bar]');
  });

  it('drops multiple columns as multiple arguments', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop column [foo], drop column [bar]');
  });

  it('test drop primary', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropPrimary();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop primary key');
  });

  it('test drop unique', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropUnique('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index users_foo_unique on [users]');
  });

  it('test drop unique, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropUnique(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index foo on [users]');
  });

  it('test drop index', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropIndex('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index users_foo_index on [users]');
  });

  it('test drop index, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropIndex(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index foo on [users]');
  });

  it('test drop foreign', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropForeign('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop constraint users_foo_foreign');
  });

  it('test drop foreign, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropForeign(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop constraint foo');
  });

  it('test drop timestamps', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropTimestamps();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] drop column [created_at], drop column [updated_at]');
  });

  it('test rename table', function() {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('exec sp_rename ?, ?');
    expect(tableSql[0].bindings[0]).to.equal('users');
    expect(tableSql[0].bindings[1]).to.equal('foo');
  });

  it('test adding primary key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.primary('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add primary key ([foo])');
  });

  it('test adding unique key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.unique('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create unique index bar on [users] ([foo])');
  });

  it('test adding index', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.index(['foo', 'bar'], 'baz');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create index baz on [users] ([foo], [bar])');
  });

  it('test adding foreign key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.foreign('foo_id').references('id').on('orders');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add constraint users_foo_id_foreign foreign key ([foo_id]) references [orders] ([id])');
  });

  it("adds foreign key with onUpdate and onDelete", function() {
    tableSql = client.schemaBuilder().createTable('person', function(table) {
      table.integer('user_id').notNull().references('users.id').onDelete('SET NULL');
      table.integer('account_id').notNull().references('id').inTable('accounts').onUpdate('cascade');
    }).toSQL();
    equal(3, tableSql.length);
    expect(tableSql[1].sql).to.equal('alter table [person] add constraint person_user_id_foreign foreign key ([user_id]) references [users] ([id]) on delete SET NULL');
    expect(tableSql[2].sql).to.equal('alter table [person] add constraint person_account_id_foreign foreign key ([account_id]) references [accounts] ([id]) on update cascade');
  });

  it('test adding incrementing id', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.increments('id');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [id] int identity(1,1) not null primary key');
  });

  it('test adding big incrementing id', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.bigIncrements('id');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [id] bigint identity(1,1) not null primary key');
  });

  it('test adding column after another column', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('name').after('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [name] nvarchar(255) after [foo]');
  });

  it('test adding column on the first place', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('first_name').first();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [first_name] nvarchar(255) first');
  });

  it('test adding string', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] nvarchar(255)');
  });

  it('uses the varchar column constraint', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo', 100);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] nvarchar(100)');
  });

  it('chains notNull and defaultTo', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo', 100).notNull().defaultTo('bar');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] nvarchar(100) not null default \'bar\'');
  });

  it('allows for raw values in the default field', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo', 100).nullable().defaultTo(client.raw('CURRENT TIMESTAMP'));
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] nvarchar(100) null default CURRENT TIMESTAMP');
  });

  it('test adding text', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.text('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] nvarchar(max)');
  });

  it('test adding big integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.bigInteger('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] bigint');
  });

  it('test adding integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.integer('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] int');
  });

  it('test adding medium integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.mediumint('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] mediumint');
  });

  it('test adding small integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.smallint('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] smallint');
  });

  it('test adding tiny integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.tinyint('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] tinyint');
  });

  it('test adding float', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.float('foo', 5, 2);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] float(5, 2)');
  });

  it('test adding double', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.double('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] double');
  });

  it('test adding double specifying precision', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.double('foo', 15, 8);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] double(15, 8)');
  });

  it('test adding decimal', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.decimal('foo', 5, 2);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] decimal(5, 2)');
  });

  it('test adding boolean', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.boolean('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] bit');
  });

  it('test adding enum', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.enum('foo', ['bar', 'baz']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] nvarchar(100)');
  });

  it('test adding date', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.date('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] date');
  });

  it('test adding date time', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dateTime('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] datetime');
  });

  it('test adding time', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.time('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] time');
  });

  it('test adding time stamp', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.timestamp('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] datetime');
  });

  it('test adding time stamps', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.timestamps();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [created_at] datetime, add [updated_at] datetime');
  });

  it('test adding binary', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.binary('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] blob');
  });

  it('test adding decimal', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.decimal('foo', 2, 6);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table [users] add [foo] decimal(2, 6)');
  });

  it('is possible to set raw statements in defaultTo, #146', function() {
    tableSql = client.schemaBuilder().createTable('default_raw_test', function(t) {
      t.timestamp('created_at').defaultTo(client.raw('GETDATE()'));
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table [default_raw_test] ([created_at] datetime default GETDATE())');
  });

  it('allows dropping a unique compound index', function() {
    tableSql = client.schemaBuilder().table('composite_key_test', function(t) {
      t.dropUnique(['column_a', 'column_b']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index composite_key_test_column_a_column_b_unique on [composite_key_test]');
  });

  it('allows default as alias for defaultTo', function() {
    tableSql = client.schemaBuilder().createTable('default_raw_test', function(t) {
      t.timestamp('created_at').default(client.raw('GETDATE()'));
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table [default_raw_test] ([created_at] datetime default GETDATE())');
  });

});