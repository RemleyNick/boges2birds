// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_nappy_vargas.sql';
import m0001 from './0001_shot_count_scaling.sql';
import m0002 from './0002_session_config.sql';

  export default {
    journal,
    migrations: {
      m0000,
      m0001,
      m0002
    }
  }
