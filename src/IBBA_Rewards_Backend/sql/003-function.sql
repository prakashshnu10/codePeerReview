CREATE OR REPLACE FUNCTION public.get_unprocessed_direct_sale(
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
    WHERE t1.direct_sale IS FALSE;
end;
$BODY$;



--------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION public.get_immediate_hightier_users(
        _user_id uuid)
    RETURNS TABLE(user_id uuid, referred_by_user_id uuid, reward_direct_sales uuid, reward_id uuid, reward_perc numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
    RETURN QUERY                 
    SELECT u.user_id, u.referred_by_user_id, rl.id AS reward_direct_sales, rl.reward_id, rl.reward_perc
FROM m_users u
LEFT JOIN m_reward_direct_sales rl ON true
WHERE u.user_id = (SELECT r.referred_by_user_id FROM m_users r WHERE r.user_id = _user_id);
END;
$BODY$;




--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_nft_direct_reward(
    _id integer,
    _value character varying)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    var varchar;
BEGIN
    SELECT constant INTO var FROM M_CONSTANTS WHERE id = _id;
    
    CASE var
        WHEN 'user_id' THEN
            RETURN QUERY SELECT * FROM public.t_user_nft_reward WHERE user_id::text = _value AND eligible_for_direct_sales = true;
    END CASE;
END;
$BODY$;



--------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_from_user_nft_direct_reward(
        _from_user_id uuid,
        _user_id uuid)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
        return query select * from public.t_user_nft_reward where from_user_id = _from_user_id and user_id = _user_id and eligible_for_direct_sales = true;
end;
$BODY$;


----------------------------------------------------------------------------



CREATE OR REPLACE FUNCTION public.get_from_user_nft_reward(
        _from_user_id uuid,
        _user_id uuid)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
        return query select * from public.t_user_nft_reward where from_user_id = _from_user_id and user_id = _user_id and eligible_for_direct_sales = false;
end;
$BODY$;



-------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_nft_indirect_reward(
	_id integer,
	_value character varying)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    var varchar;
BEGIN
    SELECT constant INTO var FROM M_CONSTANTS WHERE id = _id;
    
    CASE var
        WHEN 'user_id' THEN
            RETURN QUERY SELECT * FROM public.t_user_nft_reward WHERE user_id::text = _value AND eligible_for_direct_sales = false;
    END CASE;
END;
$BODY$;