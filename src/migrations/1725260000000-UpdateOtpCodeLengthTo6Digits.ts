import { MigrationInterface, QueryRunner } from "typeorm";


export class UpdateOtpCodeLengthTo6Digits implements MigrationInterface {
    name = 'UpdateOtpCodeLengthTo6Digits'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE otps ALTER COLUMN code TYPE varchar(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE otps ALTER COLUMN code TYPE varchar(5)`);
    }
}
