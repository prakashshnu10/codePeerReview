ALTER TABLE public.t_user_nft_reward
ADD COLUMN gas_fee numeric NULL;
--------------------------------------------

ALTER TABLE public.a_users
ADD COLUMN current_treasury_wallet varchar(50) NULL;   

------------------------------------
ALTER TABLE public.a_users
ADD COLUMN previous_treasury_wallet VARCHAR[];

---------------------------------------

INSERT INTO m_constants (constant, created_at)
VALUES ('previous_treasury_wallet', NOW());

--------------------------------------


INSERT INTO m_constants (constant, created_at)
VALUES ('current_treasury_wallet', NOW());

---------------------------------------


--------------------05-10-2023

ALTER TABLE public.t_user_nft_reward
   ADD COLUMN trx_hash varchar(255) NULL;


-----------------------------------
INSERT INTO m_constants (constant, created_at)
VALUES ('gas_fee', NOW());