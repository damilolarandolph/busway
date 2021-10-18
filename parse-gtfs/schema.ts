import { ObjectSchema } from 'realm';

export const Route: ObjectSchema = {
  name: 'Route',
  properties: {
    id: 'int',
    shortName: 'string',
    longName: 'string',
  },
  primaryKey: 'id',
};

export const schema = [Route];
