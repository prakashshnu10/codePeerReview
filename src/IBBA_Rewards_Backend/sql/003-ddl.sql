ALTER TABLE public.t_user_nft
ADD COLUMN direct_sale boolean DEFAULT false;

-------------------------------------------------------------

INSERT INTO m_constants (constant, created_at)
VALUES ('direct_sale', NOW());



------------------------------------------------------

CREATE TABLE public.m_reward_direct_sales (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        reward_id uuid NOT NULL,
        reward_perc numeric NOT NULL,
        created_at timestamp NULL,
        updated_at timestamp NULL,
        created_by varchar(255) NULL,
        updated_by varchar(255) NULL,
        CONSTRAINT m_reward_direct_sales_id_pkey PRIMARY KEY (id)
);


----------------------------------------------------------------

ALTER TABLE public.t_user_nft_reward
ADD COLUMN is_nft_purchased boolean DEFAULT false;


-------------------------------------------------------------


ALTER TABLE public.t_user_nft_reward
ADD COLUMN eligible_for_direct_sales boolean DEFAULT false;


----------------------------------------------------------------



ALTER TABLE public.t_user_nft_reward
DROP CONSTRAINT t_user_nft_reward_reward_level_id_fk;
