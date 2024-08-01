-- public.m_users definition

-- Drop table

-- DROP TABLE public.m_users;

CREATE TABLE public.m_users (
	user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	email varchar(255) NOT NULL,
	first_name varchar(100) NOT NULL,
	last_name varchar(100) NOT NULL,
	"password" varchar(100) NOT NULL,
	is_verified bool NOT NULL,
	otp varchar(50) NOT NULL,
	"level" int8 NOT NULL,
	user_wallet varchar(50) NULL,
	referral_code varchar(50) NOT NULL,
	referred_by_user_id uuid NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT m_user_email_ukey UNIQUE (email),
	CONSTRAINT m_user_referral_code_ukey UNIQUE (referral_code),
	CONSTRAINT m_user_user_id_pkey PRIMARY KEY (user_id),
	CONSTRAINT m_user_user_wallet_ukey UNIQUE (user_wallet)
);


------------------------------------


-- public.m_constants definition

-- Drop table

-- DROP TABLE public.m_constants;

CREATE TABLE public.m_constants (
	id serial4 NOT NULL,
	constant varchar(255) NOT NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT m_constants_id_pkey PRIMARY KEY (id),
	CONSTRAINT m_constants_ukey UNIQUE (constant)
);


--------------------------------------




-- public.a_users definition

-- Drop table

-- DROP TABLE public.a_users;

CREATE TABLE public.a_users (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NOT NULL,
	last_login_utc timestamp NOT NULL,
	last_login_ip varchar(100) NOT NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT a_user_id_pkey PRIMARY KEY (id),
	CONSTRAINT a_user_user_id_ukey UNIQUE (user_id)
);


-- public.a_users foreign keys

ALTER TABLE public.a_users ADD CONSTRAINT a_user_user_id_fk FOREIGN KEY (user_id) REFERENCES public.m_users(user_id);




--------------------------------------------------------

-- public.m_nft definition

-- Drop table

-- DROP TABLE public.m_nft;

CREATE TABLE public.m_nft (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	token_id int4 NOT NULL,
	title varchar(255) NULL,
	image varchar(255) NULL,
	price numeric NULL,
	contract_address varchar(255) NOT NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	description varchar(500) NULL,
	CONSTRAINT m_id_pkey PRIMARY KEY (id),
	CONSTRAINT m_token_id_ukey UNIQUE (token_id)
);


------------------------------------------




-- public.m_reward definition

-- Drop table

-- DROP TABLE public.m_reward;

CREATE TABLE public.m_reward (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	code varchar(50) NOT NULL,
	description varchar(255) NOT NULL,
	from_date timestamp NULL,
	to_date timestamp NULL,
	num_level int8 NOT NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT m_reward_code_ukey UNIQUE (code),
	CONSTRAINT m_reward_id_pkey PRIMARY KEY (id)
);

--------------------------


-- public.m_badges definition

-- Drop table

-- DROP TABLE public.m_badges;

CREATE TABLE public.m_badges (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	badge varchar(100) NOT NULL,
	min_nft_criteria int8 NOT NULL,
	bonus_amount numeric NOT NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT m_badges_code_ukey UNIQUE (badge),
	CONSTRAINT m_badges_id_pkey PRIMARY KEY (id)
);


-----------------------------------

-- public.m_reward_level definition

-- Drop table

-- DROP TABLE public.m_reward_level;

CREATE TABLE public.m_reward_level (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	reward_id uuid NOT NULL,
	"level" int8 NOT NULL,
	reward_perc numeric NOT NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT m_reward_level_id_pkey PRIMARY KEY (id)
);


-- public.m_reward_level foreign keys

ALTER TABLE public.m_reward_level ADD CONSTRAINT m_reward_level_reward_id_fk FOREIGN KEY (reward_id) REFERENCES public.m_reward(id);



------------------------------



-- public.t_user_badges definition

-- Drop table

-- DROP TABLE public.t_user_badges;

CREATE TABLE public.t_user_badges (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NOT NULL,
	badge_id uuid NOT NULL,
	bonus_amount numeric NOT NULL,
	bonus_distributed bool NULL DEFAULT false,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	trx_hash varchar(255) NULL,
	CONSTRAINT t_user_badges_id_pkey PRIMARY KEY (id),
	CONSTRAINT t_user_badges_user_id_badge_id_ukey UNIQUE (user_id, badge_id)
);


-- public.t_user_badges foreign keys

ALTER TABLE public.t_user_badges ADD CONSTRAINT t_user_badges_badges_id_fk FOREIGN KEY (badge_id) REFERENCES public.m_badges(id);
ALTER TABLE public.t_user_badges ADD CONSTRAINT t_user_badges_user_id_fk FOREIGN KEY (user_id) REFERENCES public.m_users(user_id);


----------------------------------------


-- public.t_user_nft definition

-- Drop table

-- DROP TABLE public.t_user_nft;

CREATE TABLE public.t_user_nft (
	trx_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NOT NULL,
	nft_id uuid NOT NULL,
	market_type varchar(100) NULL,
	processed bool NULL DEFAULT false,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT t_user_trx_id_pkey PRIMARY KEY (trx_id)
);


-- public.t_user_nft foreign keys

ALTER TABLE public.t_user_nft ADD CONSTRAINT t_user_nft_nft_id_fk FOREIGN KEY (nft_id) REFERENCES public.m_nft(id);
ALTER TABLE public.t_user_nft ADD CONSTRAINT t_user_nft_user_id_fk FOREIGN KEY (user_id) REFERENCES public.m_users(user_id);





------------------------------------


-- public.t_user_nft_reward definition

-- Drop table

-- DROP TABLE public.t_user_nft_reward;

CREATE TABLE public.t_user_nft_reward (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NOT NULL,
	from_user_id uuid NOT NULL,
	nft_id uuid NOT NULL,
	reward_id uuid NOT NULL,
	reward_level_id uuid NOT NULL,
	reward_amount numeric NOT NULL,
	reward_distributed bool NULL DEFAULT false,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	created_by varchar(255) NULL,
	updated_by varchar(255) NULL,
	CONSTRAINT t_user_nft_reward_id_pkey PRIMARY KEY (id)
);


-- public.t_user_nft_reward foreign keys

ALTER TABLE public.t_user_nft_reward ADD CONSTRAINT t_user_nft_reward_nft_id_fk FOREIGN KEY (nft_id) REFERENCES public.m_nft(id);
ALTER TABLE public.t_user_nft_reward ADD CONSTRAINT t_user_nft_reward_reward_id_fk FOREIGN KEY (reward_id) REFERENCES public.m_reward(id);
ALTER TABLE public.t_user_nft_reward ADD CONSTRAINT t_user_nft_reward_reward_level_id_fk FOREIGN KEY (reward_level_id) REFERENCES public.m_reward_level(id);
ALTER TABLE public.t_user_nft_reward ADD CONSTRAINT t_user_nft_reward_user_id_fk FOREIGN KEY (user_id) REFERENCES public.m_users(user_id);




------------------
