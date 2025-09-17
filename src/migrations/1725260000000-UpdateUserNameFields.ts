import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserNameFields1725260000000 implements MigrationInterface {
  name = 'UpdateUserNameFields1725260000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add firstName and lastName columns to users table
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`firstName\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`lastName\` varchar(255) NOT NULL`);
    
    // Migrate existing name data to firstName and lastName
    await queryRunner.query(`
      UPDATE \`users\` 
      SET 
        \`firstName\` = CASE 
          WHEN LOCATE(' ', \`name\`) > 0 
          THEN SUBSTRING(\`name\`, 1, LOCATE(' ', \`name\`) - 1)
          ELSE \`name\`
        END,
        \`lastName\` = CASE 
          WHEN LOCATE(' ', \`name\`) > 0 
          THEN SUBSTRING(\`name\`, LOCATE(' ', \`name\`) + 1)
          ELSE ''
        END
    `);
    
    // Drop the old name column
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`name\``);

    // Add firstName and lastName columns to app_admins table
    await queryRunner.query(`ALTER TABLE \`app_admins\` ADD \`firstName\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`app_admins\` ADD \`lastName\` varchar(255) NOT NULL`);
    
    // Migrate existing name data to firstName and lastName for app_admins
    await queryRunner.query(`
      UPDATE \`app_admins\` 
      SET 
        \`firstName\` = CASE 
          WHEN LOCATE(' ', \`name\`) > 0 
          THEN SUBSTRING(\`name\`, 1, LOCATE(' ', \`name\`) - 1)
          ELSE \`name\`
        END,
        \`lastName\` = CASE 
          WHEN LOCATE(' ', \`name\`) > 0 
          THEN SUBSTRING(\`name\`, LOCATE(' ', \`name\`) + 1)
          ELSE ''
        END
    `);
    
    // Drop the old name column from app_admins
    await queryRunner.query(`ALTER TABLE \`app_admins\` DROP COLUMN \`name\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add name column back to users table
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`name\` varchar(255) NOT NULL`);
    
    // Migrate firstName and lastName back to name
    await queryRunner.query(`
      UPDATE \`users\` 
      SET \`name\` = CONCAT(\`firstName\`, ' ', \`lastName\`)
    `);
    
    // Drop firstName and lastName columns
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`lastName\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`firstName\``);

    // Add name column back to app_admins table
    await queryRunner.query(`ALTER TABLE \`app_admins\` ADD \`name\` varchar(255) NOT NULL`);
    
    // Migrate firstName and lastName back to name for app_admins
    await queryRunner.query(`
      UPDATE \`app_admins\` 
      SET \`name\` = CONCAT(\`firstName\`, ' ', \`lastName\`)
    `);
    
    // Drop firstName and lastName columns from app_admins
    await queryRunner.query(`ALTER TABLE \`app_admins\` DROP COLUMN \`lastName\``);
    await queryRunner.query(`ALTER TABLE \`app_admins\` DROP COLUMN \`firstName\``);
  }
}
