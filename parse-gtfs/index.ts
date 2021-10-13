import Realm, { ObjectSchema } from 'realm';

const Route: ObjectSchema = {
  name: 'Route',
  properties: {
    id: 'int',
    shortName: 'string',
    longName: 'string',
  },
  primaryKey: 'id',
};

const realm = new Realm({
  path: '../assets/db.realm',
  schema: [Route],
  schemaVersion: 1,
});
