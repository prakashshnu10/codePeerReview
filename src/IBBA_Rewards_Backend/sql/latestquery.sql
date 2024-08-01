-------------------------27-09-2023

ALTER TABLE public.t_user_nft
ADD COLUMN nft_price numeric NULL;
	
	
---------------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS public.post_user_nft(uuid, uuid, character varying, character varying, character varying);

-----------------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE public.post_user_nft(
	IN _user_id uuid,
	IN _nft_id uuid,
	IN _market_type character varying,
	IN _created_by character varying,
	IN _updated_by character varying,
	IN _nft_price numeric)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_nft(user_id, nft_id, market_type, created_at, updated_at, created_by, updated_by, nft_price)
	VALUES(_user_id, _nft_id, _market_type, current_timestamp, current_timestamp, _created_by, _updated_by, _nft_price);
$BODY$;


---------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_unprocessed();


----------------------------------------------



CREATE OR REPLACE FUNCTION public.get_unprocessed(
	)
    RETURNS TABLE(user_id uuid, nft_id uuid, trx_id uuid, nft_price numeric, created_at timestamp without time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
begin
return QUERY 		
SELECT t1.user_id, t1.nft_id, t1.trx_id, t1.nft_price, t1.created_at
    FROM t_user_nft t1
    LEFT JOIN m_nft t2 ON t1.nft_id = t2.id
    WHERE t1.processed IS FALSE;
end;
$BODY$;


------------------------------------------------------------------


----28-09-2023

DROP FUNCTION IF EXISTS public.get_undistributed_rewards();

---------------------------------------------------------------


CREATE OR REPLACE FUNCTION public.get_undistributed_rewards(
	)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

    SELECT * 
    FROM public.t_user_nft_reward
    WHERE reward_distributed = false;
$BODY$;



---------------------------------------------------------------


	ALTER TABLE public.t_user_nft_reward
   ADD COLUMN message varchar(500) NULL;


29-09-2023---------------------------------------------------------------

INSERT INTO m_constants (constant, created_at)
VALUES ('message', NOW());


----------------------------------------

INSERT INTO m_constants (constant, created_at)
VALUES ('reward_distributed', NOW());

-----------------------------------------------



-- PROCEDURE: public.put_user_nft_reward_by_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_user_nft_reward_by_id(jsonb, character varying);

CREATE OR REPLACE PROCEDURE public.put_user_nft_reward_by_id(
	IN data jsonb,
	IN _id character varying)
LANGUAGE 'plpgsql'
AS $BODY$

declare 
    var varchar;
    key varchar;
    value varchar;
begin
    FOR key, value IN SELECT * FROM jsonb_each_text(data) loop
	    select constant into var from M_CONSTANTS where id = key::int;
        RAISE NOTICE 'Key: %, Value: %', key::int, value;
        case var
		when 'reward_distributed' then update public.t_user_nft_reward set reward_distributed = cast(value as BOOLEAN), updated_at = current_timestamp where id::text = _id;
		when 'message' then update public.t_user_nft_reward set message = value, updated_at = current_timestamp where id::text = _id;
		end case;
    END LOOP;
END;
$BODY$;
