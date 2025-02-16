# Backup and Recovery Guide

## Overview

This guide details the backup and recovery procedures for MDMAPanel, ensuring data safety and system reliability.

## Backup Types

### Database Backup

#### Full Database Backup
```bash
#!/bin/bash
# backup-full.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
DB_NAME="mdmapanel"
DB_USER="postgres"

# Create backup
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/full_backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/full_backup_$TIMESTAMP.sql

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +7 -delete
```

#### Guild-Specific Backup
```bash
#!/bin/bash
# backup-guild.sh
GUILD_NAME=$1
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups/guilds"

# Backup guild-specific data
pg_dump -U postgres mdmapanel \
  --table="guildsettings" \
  --table="guilddomains" \
  --where="guild = '$GUILD_NAME'" \
  > $BACKUP_DIR/${GUILD_NAME}_backup_$TIMESTAMP.sql
```

### File System Backup

#### Configuration Files
```bash
#!/bin/bash
# backup-config.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups/config"

# Backup configuration files
tar -czf $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz \
  .env* \
  config/*.json \
  ssl/*.pem
```

#### Static Assets
```bash
#!/bin/bash
# backup-assets.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups/assets"

# Backup static assets
tar -czf $BACKUP_DIR/assets_backup_$TIMESTAMP.tar.gz \
  static/* \
  public/*
```

## Automated Backup Schedule

### Cron Configuration
```bash
# /etc/cron.d/mdmapanel-backup

# Database backups
0 1 * * * root /path/to/scripts/backup-full.sh
0 */6 * * * root /path/to/scripts/backup-guild.sh main_guild

# Configuration backups
0 2 * * * root /path/to/scripts/backup-config.sh

# Asset backups
0 3 * * 0 root /path/to/scripts/backup-assets.sh
```

## Backup Verification

### Database Backup Verification
```bash
#!/bin/bash
# verify-backup.sh
BACKUP_FILE=$1
TEST_DB="mdmapanel_test"

# Create test database
createdb $TEST_DB

# Restore backup
psql -d $TEST_DB < $BACKUP_FILE

# Run verification queries
psql -d $TEST_DB -c "SELECT COUNT(*) FROM users;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM targets;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM guildsettings;"

# Cleanup
dropdb $TEST_DB
```

## Recovery Procedures

### Database Recovery

#### Full Database Recovery
```bash
#!/bin/bash
# recover-full.sh
BACKUP_FILE=$1
DB_NAME="mdmapanel"

# Stop application
pm2 stop mdmapanel

# Drop existing database
dropdb $DB_NAME

# Create fresh database
createdb $DB_NAME

# Restore from backup
psql -d $DB_NAME < $BACKUP_FILE

# Start application
pm2 start mdmapanel
```

#### Guild Recovery
```bash
#!/bin/bash
# recover-guild.sh
BACKUP_FILE=$1
GUILD_NAME=$2
DB_NAME="mdmapanel"

# Restore guild data
psql -d $DB_NAME -c "BEGIN;"
psql -d $DB_NAME -c "DELETE FROM guildsettings WHERE guild = '$GUILD_NAME';"
psql -d $DB_NAME -c "DELETE FROM guilddomains WHERE guild = '$GUILD_NAME';"
psql -d $DB_NAME < $BACKUP_FILE
psql -d $DB_NAME -c "COMMIT;"
```

### Configuration Recovery
```bash
#!/bin/bash
# recover-config.sh
BACKUP_FILE=$1
TEMP_DIR="/tmp/config_recovery"

# Extract backup
mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Verify files
if [ -f "$TEMP_DIR/.env" ] && [ -f "$TEMP_DIR/config/default.json" ]; then
  # Restore files
  cp $TEMP_DIR/.env ./.env
  cp -r $TEMP_DIR/config/* ./config/
  echo "Configuration restored successfully"
else
  echo "Backup verification failed"
  exit 1
fi

# Cleanup
rm -rf $TEMP_DIR
```

## Disaster Recovery

### Complete System Recovery
```bash
#!/bin/bash
# disaster-recovery.sh
BACKUP_DIR=$1
TIMESTAMP=$2

# Stop services
pm2 stop all

# Restore database
./recover-full.sh $BACKUP_DIR/full_backup_$TIMESTAMP.sql

# Restore configuration
./recover-config.sh $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz

# Restore assets
./recover-assets.sh $BACKUP_DIR/assets_backup_$TIMESTAMP.tar.gz

# Verify system
./verify-system.sh

# Start services
pm2 start all
```

## Monitoring and Maintenance

### Backup Monitoring
```javascript
// monitor-backups.js
const checkBackups = async () => {
  const backups = await listBackups();
  const issues = [];

  // Check backup age
  for (const backup of backups) {
    const age = getBackupAge(backup);
    if (age > MAX_BACKUP_AGE) {
      issues.push(`Backup ${backup} is too old: ${age} hours`);
    }
  }

  // Check backup size
  for (const backup of backups) {
    const size = await getBackupSize(backup);
    if (size < MIN_BACKUP_SIZE) {
      issues.push(`Backup ${backup} is too small: ${size} bytes`);
    }
  }

  // Alert if issues found
  if (issues.length > 0) {
    await sendAlert('Backup Issues', issues.join('\n'));
  }
};
```

### Storage Management
```bash
#!/bin/bash
# manage-storage.sh

# Set retention periods
DAILY_RETENTION=7    # days
WEEKLY_RETENTION=4   # weeks
MONTHLY_RETENTION=3  # months

# Cleanup daily backups
find /path/to/backups/daily -mtime +$DAILY_RETENTION -delete

# Cleanup weekly backups
find /path/to/backups/weekly -mtime +$((WEEKLY_RETENTION * 7)) -delete

# Cleanup monthly backups
find /path/to/backups/monthly -mtime +$((MONTHLY_RETENTION * 30)) -delete
```

## Best Practices

1. **Regular Testing**
   - Test backup restoration monthly
   - Verify backup integrity
   - Document recovery time

2. **Security**
   - Encrypt sensitive backups
   - Secure backup storage
   - Limit access permissions

3. **Documentation**
   - Maintain backup inventory
   - Document recovery procedures
   - Keep contact information updated

4. **Monitoring**
   - Monitor backup success/failure
   - Track backup sizes
   - Alert on issues

## Emergency Procedures

### System Failure
1. Assess the failure scope
2. Identify latest valid backup
3. Follow recovery procedures
4. Verify system integrity
5. Document incident

### Data Corruption
1. Stop affected services
2. Identify corruption scope
3. Restore from last good backup
4. Verify data integrity
5. Resume services
