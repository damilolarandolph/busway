import * as SQLite from 'expo-sqlite';
import * as Asset from 'expo-asset';
import * as FileSystem from 'expo-file-system';

class Database {
  public static instance: Promise<SQLite.WebSQLDatabase>;

  public static async init() {
    if (
      !(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite'))
        .exists
    ) {
      await FileSystem.makeDirectoryAsync(
        FileSystem.documentDirectory + 'SQLite',
      );
      console.log('create db folder');
    }
    if (
      !(
        await FileSystem.getInfoAsync(
          FileSystem.documentDirectory + 'SQLite/test.db',
        )
      ).exists
    ) {
      console.log('loading db');
      await FileSystem.downloadAsync(
        Asset.Asset.fromModule(require('./test.db')).uri,
        FileSystem.documentDirectory + 'SQLite/test.db',
      );
    }
    return SQLite.openDatabase('test.db');
  }

  public static async execSql(
    queries: SQLite.Query[],
    readOnly: boolean,
  ): Promise<(SQLite.ResultSet | undefined)[]> {
    const db = await Database.instance;
    return new Promise((resolve, reject) => {
      db.exec(queries, readOnly, (err, res) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(res as (SQLite.ResultSet | undefined)[]);
        }
      });
    });
  }
}

Database.instance = Database.init();

export { Database };
