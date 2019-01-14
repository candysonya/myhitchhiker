import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Api {

    @PrimaryColumn()
    id: string;

    @Column()
    keyword: string;

	@Column()
	author: string;

    @Column()
    name: string;

    @Column()
    uri: string;

    @Column()
    method: string;

    @Column({ default: false })
    isJson?: boolean;

    @Column()
    description: string;

    @Column()
	header: string;

    @Column('mediumtext')
	param: string;

}