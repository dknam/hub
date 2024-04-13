export const spQueryMs = `
    /*****************************************************************************
1. Create Date : 2021.05.17
2. Creator     : 신희준
3. Description : 기존 "미수금 정리 서비스"에서 요청시 바로 처리하는 Worker방식으로 변경됨에 따라 
                 실행정보 관련 테이블을제거함 (기존 SP : ESP_CLOSING_INSERT_MNG001_AMT)
4. File List   : 미수금정리 
5. Example     : exec ESP_CLOSING_INSERT_MNG001_AMT
6. Precaution  : 
7. History     :
                2021.11.18(ygh) - 80000번(E zone)에서 만들어진 미수금 데이터를 각 zone별로 만들어주는 서비스가 실행될 기준 데이터 INSERT 추가
                2022.09.13(ygh) - 미수차단된 회사코드중 미수금이 없는 데이터 목록을 반환하도록 수정 및 워커 버전에 따라 결과를 다르게 내려주도록 @EXEC_VER 파라메타 추가
                2022.09.27(ygh) - PG 회계기준 미수금 데이터를 이용하도록 변경
                2023.09.05(hrkim)  - 미수금.. A23_00590 - 해외 freetial 관리 및 관리자 정리
                2023.12.20 (Jungsu) - A23_06354 80000번 미수금정리 로직 수정
                2024.02.28 (JungsuYeom) - A23_06448 - 회계통합집계 적용_8만번 미수금
8. 고부하SP    : 
9. OLD SP NAME : ESP_CLOSING_INSERT_MNG001_AMT
*****************************************************************************/
ALTER PROCEDURE [dbo].[ESP_CLOSING_INSERT_MNG001_AMT_V3]
    @EXEC_DATE	DATETIME,		-- 미수금정리 실행 시간
    @EXEC_ID	VARCHAR(30),	-- 미수금정리 실행 ID
    @EXEC_TYPE	CHAR(1),		-- 미수금정리 실행 타입
    @EXEC_VER	CHAR(1),			-- 미수금정리 실행 버전 (2 : 부하개선전, 3 : 부하개선후, 4 : PG 회계기준 미수금 데이터 사용)
    @OVERSEAS_BRANCH  CHAR(2),
    @DOMAIN_CODE VARCHAR(6),
    @RCV_AMT_LIST nvarchar(max)  -- 미수금 회사 목록
     
AS

SET NOCOUNT ON
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED

 
-- 각 zone별 미수금 데이터를 만들어주기 위한 서비스 실행정보
INSERT INTO ECMN_AMT_EXEC_INFO (EXEC_DATE, EXEC_ID, EXEC_TYPE)
VALUES (@EXEC_DATE, @EXEC_ID, @EXEC_TYPE)


 
IF @OVERSEAS_BRANCH = 'Y'
BEGIN
    -- 미수차단된 회사코드중 미수금이 없는 목록 반환(V3) 
    -- 해외...
    SELECT PP.COM_CODE, PP.GUBUN, PP.DELAY_DATE, PP.REAL_TAX_CODE, PP.ZONE
           , CASE WHEN PP.BILL_MON_CYCLE = 11 THEN 12 ELSE PP.BILL_MON_CYCLE END BILL_MON_CYCLE
    FROM (
        SELECT A.COM_CODE, A.GUBUN, A.DELAY_DATE, A.REAL_TAX_CODE, A.ZONE
               ,CASE WHEN A.MON_PRICE = 0 THEN 0 
                     ELSE (ISNULL(B.AMT,0) * -1) / A.MON_PRICE END AS BILL_MON_CYCLE
        FROM (
            SELECT A.COM_CODE, A.GUBUN, A.DELAY_DATE, B.REAL_TAX_CODE, C.ZONE, ISNULL(B.MON_PRICE, 0) MON_PRICE
             
            FROM ACC001 A WITH(NOLOCK, READUNCOMMITTED)
            LEFT OUTER JOIN ECMN_BILLING B WITH(NOLOCK, READUNCOMMITTED)
            ON A.COM_CODE = B.COM_CODE
            INNER JOIN GLOBAL_MANAGE.DBO.COMPANY_ZONE_INFO C WITH(NOLOCK, READUNCOMMITTED)
            ON A.COM_CODE = C.COM_CODE
            INNER JOIN  OPENJSON(@RCV_AMT_LIST) WITH( CUST VARCHAR(30), AMT DECIMAL, COM_CODE VARCHAR(6)) AS P 
            ON A.COM_CODE =  P.cust
            AND P.COM_CODE = @DOMAIN_CODE
            WHERE A.SVC_TYPE_CD IN (
                SELECT SVC_TYPE_CD 
                FROM ACCT_MANAGE.DBO.ECMN_SVC_TYPE_INFO WITH(NOLOCK,READUNCOMMITTED) 
                WHERE NEXT_SVC_TYPE_CD = 'P018'	 
                )
        ) AS A
        LEFT JOIN OPENJSON(@RCV_AMT_LIST) WITH( CUST VARCHAR(30), AMT DECIMAL, COM_CODE VARCHAR(6)) AS B 
        ON A.REAL_TAX_CODE = B.CUST
        WHERE ISNULL(B.AMT, 0) < 0
    ) PP
   WHERE   round(PP.BILL_MON_CYCLE, 10) - FLOOR(round(PP.BILL_MON_CYCLE, 10)) = 0
     AND   PP.BILL_MON_CYCLE BETWEEN 1 AND 11
END 
ELSE 
BEGIN
    -- 미수차단된 회사코드중 미수금이 없는 목록 반환(V3)
    SELECT A.*
    FROM (
        SELECT A.COM_CODE, A.GUBUN, A.DELAY_DATE, B.REAL_TAX_CODE, C.ZONE, 0 BILL_MON_CYCLE
        FROM ACC001 A WITH(NOLOCK, READUNCOMMITTED)
        LEFT OUTER JOIN ECMN_BILLING B WITH(NOLOCK, READUNCOMMITTED)
        ON A.COM_CODE = B.COM_CODE
        INNER JOIN GLOBAL_MANAGE.DBO.COMPANY_ZONE_INFO C WITH(NOLOCK, READUNCOMMITTED)
        ON A.COM_CODE = C.COM_CODE
     
        WHERE A.SVC_TYPE_CD IN (
            SELECT SVC_TYPE_CD 
            FROM ACCT_MANAGE.DBO.ECMN_SVC_TYPE_INFO WITH(NOLOCK,READUNCOMMITTED) 
                WHERE NEXT_SVC_TYPE_CD = 'A003'	 
            )
    ) AS A
    LEFT JOIN OPENJSON(@RCV_AMT_LIST) WITH( CUST VARCHAR(30), AMT DECIMAL, COM_CODE VARCHAR(6)) AS B
    ON A.REAL_TAX_CODE = B.CUST
     
    WHERE ISNULL(B.AMT, 0) <= 0

END



SET NOCOUNT OFF  
    `;
export const spQueryMy = `
    DELIMITER $$

    USE \`EC_COMMON\`$$
    
    DROP PROCEDURE \`ESP_CMCD_COMPANY_CREATE_JOB_INSERT\`$$
    
    CREATE DEFINER=\`ecount0001\`@\`%\` PROCEDURE \`ESP_CMCD_COMPANY_CREATE_JOB_INSERT\`(
        $COM_CODE		VARCHAR(6),		-- 저장할 회사코드
        $ZA_COM_CODE	VARCHAR(6),		-- 저장 기본 회사코드
        $USER_ID		VARCHAR(30),	-- 마스터ID
        $ZA_COPY_FLAG	CHAR(1),		-- ZACODE COPY FLAG
        $TABLE_NAME		VARCHAR(128),
        $COL_WDT		VARCHAR(20),
        $COL_EDT		VARCHAR(20)
    )
        SQL SECURITY INVOKER
    BEGIN
    /* ************************************************************    
    1. Create Date	: 2018.08.09
    2. Creator		: 이현택
    3. Description	: EC_COMMON 기초코드 복사
    4. File List	: ChangeSettingZACodeAction.cs > ChangeSettingZACodeBiz.cs
    5. Example		: CALL ESP_CMCD_COMPANY_CREATE_JOB_INSERT('91105', 'ZA001', 'test', 'N', 'ECMN_MYPAGE_LIST', 'WRITEDATE', NULL)
    6. Precaution	:     
    7. History		: 2018.10.30 이수진 - Dev. 15187 신규코드 가입시 에러로그 오류수정
                      2019.07.19 이수진 - 가입 시 다목적 코드형 추가항목 데이터 복사
                      2019.08.08 hrkim - 가입 시 다목적 코드형 추가항목 데이터 복사 수정
                      2019.08.09 소병용 - EditDt, WriteDt Replace 관련 수정
                      2019.11.04 박철민 - 신규코드 가입시 A/S진행단계코드,수리유형코드그룹 과 A/S진행단계코드데이터 복사 (수리유형은 코드그룹만 복사)
                      2020.01.14 김형래 - 인사카드 관련 사용자 코드 데이터 복사 추가
                      2020.01.21 김형래 - 인사카드 관련 사용자 코드 데이터 복사 추가 - 버그 수정
                      2020.04.24 오문영 - CM_ADD_ITEM_C 컬럼 추가
                      2020.06.23 (Kim Woojeong) - [A20_01943] 급여 DB 분리
                      2020.07.20 (Kim Woojeong) - [A20_03328] 코드형 추가항목 테이블 관리 DB로 분리
                      2020.08.13 오문영 - CM_ADD_ITEM_C, CM_ADD_GROUP_C 진행상태 동기화 추가
                      2020.08.25(김선웅) - A20_03359 - 마리아의 기초코드 정보 신규 관리 DB로 이관
                      2021.07.29 장아람 - [A21_03115] 유저페이 사용메뉴 설정주기
                      2024.03.15 (박철민) - A24_01532 CM DB의 코드형 추가항목테이블 - 구, 신규테이블에 양방향 저장및 수정, 삭제
                      2024.04.08 (박철민) - A24_01536 CM DB / GW DB의 중복테이블 - 기존 테이블 리네임및 사용로직 제거
    8. 고부하SP		: 
    9. OLD SP NAME	: 
    *************************************************************/ 
    SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    
    SET @TABLE_NAME = $TABLE_NAME;
    SET @COM_CODE = $COM_CODE;
    SET @ZA_COM_CODE = $ZA_COM_CODE;
    SET @USER_ID = IFNULL($USER_ID, '');
    SET @COL_WDT = IFNULL($COL_WDT, '');
    SET @COL_EDT = IFNULL($COL_EDT, '');
    
    SET @COLUMN_LIST_STRING = '';
    SET @COLUMN_LIST = '';
    SET @DEL_SQL_STRING = ''; 
    SET @SQL_STRING = '';
    SET @WDATE_TYPE = '';
    SET @EDATE_TYPE = '';
    
    SET @COLUMN_LIST = CONCAT(@COLUMN_LIST, 'SELECT GROUP_CONCAT(COLUMN_NAME) INTO @COLUMN_LIST_STRING FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ''EC_COMMON'' AND TABLE_NAME=''',@TABLE_NAME,'''');
     
    PREPARE STMT_COLUMN FROM @COLUMN_LIST;
    EXECUTE STMT_COLUMN;
    DEALLOCATE PREPARE STMT_COLUMN;
    
    SET @DEL_SQL_STRING = CONCAT(@DEL_SQL_STRING,' DELETE FROM ',@TABLE_NAME,' WHERE COM_CODE=''',@COM_CODE,''';' );
    
    PREPARE STMT_DELETE FROM @DEL_SQL_STRING;
    EXECUTE STMT_DELETE;
    DEALLOCATE PREPARE STMT_DELETE;
    
    SET @SQL_STRING = CONCAT(@SQL_STRING, ' INSERT INTO ', @TABLE_NAME, ' ');
    SET @COLUMN_COM_CODE_LIST = REPLACE(@COLUMN_LIST_STRING, 'COM_CODE', CONCAT('''', @COM_CODE, '''')); 
    
    IF $ZA_COPY_FLAG <> 'Y' AND (@TABLE_NAME = 'ECMN_MYPAGE_GRP' OR @TABLE_NAME = 'ECMN_MYPAGE_LIST') THEN
        SET @COLUMN_COM_CODE_LIST = REPLACE(@COLUMN_COM_CODE_LIST, 'USERID', CONCAT('''', @USER_ID, '''')); 
    END IF;
    
    SELECT IFNULL(DATA_TYPE, '') INTO @WDATE_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'EC_COMMON' AND TABLE_NAME = @TABLE_NAME AND COLUMN_NAME = @COL_WDT;
    SELECT IFNULL(DATA_TYPE, '') INTO @EDATE_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'EC_COMMON' AND TABLE_NAME = @TABLE_NAME AND COLUMN_NAME = @COL_EDT;
    
    IF @WDATE_TYPE <> '' THEN
    BEGIN
        IF @WDATE_TYPE = 'DATETIME' THEN
            SET @COLUMN_COM_CODE_LIST = REPLACE(@COLUMN_COM_CODE_LIST, @COL_WDT, CONCAT('''',NOW(),'''')); 
        ELSE
            SET @COLUMN_COM_CODE_LIST = REPLACE(@COLUMN_COM_CODE_LIST, @COL_WDT, CONCAT('''',DATE_FORMAT(NOW(), '%Y%m%d'),'''')); 
        END IF;
    END;
    END IF;
    
    IF @EDATE_TYPE <> '' THEN
    BEGIN
        IF @WDATE_TYPE = 'DATETIME' THEN
            SET @COLUMN_COM_CODE_LIST = REPLACE(@COLUMN_COM_CODE_LIST, @COL_EDT, CONCAT('''',NOW(),'''')); 
        ELSE
            SET @COLUMN_COM_CODE_LIST = REPLACE(@COLUMN_COM_CODE_LIST, @COL_EDT, CONCAT('''',DATE_FORMAT(NOW(), '%Y%m%d'),'''')); 
        END IF;
    END;
    END IF;
    
    IF @TABLE_NAME = 'CM_PRGS_STG_ITEM_C' THEN
    -- 다목적 코드형항목 기본 데이터
      SET @SQL_STRING = CONCAT(@SQL_STRING, '(', @COLUMN_LIST_STRING, ')');
      SET @SQL_STRING = CONCAT(@SQL_STRING, ' SELECT ','''', @COM_CODE,''''
                                           , ' ,T1.USERTABLE_CD,T1.ITEM_CD,T1.ADD_ITEM_NM,T1.PRN_SEQ_NO,T1.USE_SPNS_TF, IFNULL(T1.RMRK,'''') AS RMRK,T1.BASC_ITEM_TF,T1.CD_STAT_CD,T1.WRTR_ID,T1.WRT_DT,T1.MODR_ID,T1.MOD_DT '
                                          ,' FROM ', @TABLE_NAME, ' T1  JOIN CM_PRGS_STG_GROUP_C  T2 '
                                          ,' ON T1.COM_CODE = T2.COM_CODE AND T1.USERTABLE_CD = T2.USERTABLE_CD '
                                          ,' AND (T2.PRG_GRP = 30 OR (T2.PRG_GRP = 20 AND T1.USERTABLE_CD = ''A'') OR T1.USERTABLE_CD LIKE ''E04%'') ' 
                                          , ' WHERE T1.COM_CODE =  ''', @ZA_COM_CODE, '''');    
    ELSE 
      SET @SQL_STRING = CONCAT(@SQL_STRING, '(', @COLUMN_LIST_STRING, ')');
      SET @SQL_STRING = CONCAT(@SQL_STRING, ' SELECT ', @COLUMN_COM_CODE_LIST, ' FROM ', @TABLE_NAME, ' WHERE COM_CODE =  ''', @ZA_COM_CODE, '''');
    END IF;
    
    -- 마이페이지 데이터
    IF (@TABLE_NAME = 'ECMN_MYPAGE_GRP' OR @TABLE_NAME = 'ECMN_MYPAGE_LIST') THEN
        SET @SQL_STRING = CONCAT(@SQL_STRING, ' AND USERID = ''zamaster'' ');
    END IF;
    
    IF @TABLE_NAME = 'COMN_MENUAUTH' THEN
        SET @SQL_STRING = CONCAT(@SQL_STRING, ' AND MENU_CD NOT LIKE ''M11%'' ');
    END IF;
    
    -- 다목적 코드형항목 기본 데이터 + A/S진행단계,수리유형코드그룹 데이터
    IF @TABLE_NAME = 'CM_PRGS_STG_GROUP_C' THEN
        SET @SQL_STRING = CONCAT(@SQL_STRING, ' AND ( PRG_GRP = 30 OR (PRG_GRP = 20 AND USERTABLE_CD IN(''A'', ''C'')) OR USERTABLE_CD LIKE ''E04%'')');
    END IF;
    
    -- USERPAY 마이페이지 데이터
    IF (@TABLE_NAME = 'CM_PRMS_MENU_GRP_M' OR @TABLE_NAME = 'CM_PRMS_MENU_ITEM_T') THEN
        SET @SQL_STRING = CONCAT(@SQL_STRING, ' AND SYS_DV_CD = ''U'' ');
    END IF;
    
    PREPARE STMT_INSERT FROM @SQL_STRING;
    EXECUTE STMT_INSERT;
    DEALLOCATE PREPARE STMT_INSERT;	
    
    SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ; 	
    
    END$$
    
    DELIMITER ;
    `;
export const spQueryPg = `
    CREATE OR REPLACE FUNCTION bizz.fn_sum_unity_byday_force(
		v_com_code character varying
	,	v_month character varying
	,	v_sum_type_cd_01 character varying									/* 집계유형대분류 : 재고-INV, 고정자산-ACC_FXASET, 회계-ACC, 미청구채권-ACC_RECEIVABLE, 미청구채무-ACC_PAYABLE*/
	,	v_by_sum_tf_01 character DEFAULT NULL::character(1)					/* 회계-부서(사용:Y/미사용:N), 미청구채권채무-부서,프로젝트(사용:C/미사용:W), 재고-관리항목(사용:Y/미사용:N)*/
	,	v_by_sum_tf_02 character DEFAULT NULL::character(1)					/* 회계-프로젝트(사용:Y/미사용:N) */
	,	v_user_sid character varying DEFAULT NULL::character varying(100) 	/* 사용자고유아이디 */
	,	v_bal_stand_dt character varying DEFAULT NULL::character varying(8)	/* 잔액기준월 : 재고, 회계 */
	,	v_refer_sid character DEFAULT NULL									/* 회계-계정별 부서/프로젝트집계여부변경될때 사용하는 조건 '76FDVFKD7SF4NJT'::char(15) */
	,	v_item_type character varying DEFAULT NULL							/* 회계-계정별 부서/프로젝트집계여부변경될때 사용하는 조건 'GYE'::varchar(100)*/
	,	v_nol4_flag boolean DEFAULT false									/* nol4여부 파라미터 */
)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
/* ****************************************************************************
1. Create Date : 2022.12.29
2. Creator     : Jang Jaehui
3. Description : 재고일선분 강제집계 function
4. File List   : 
5. Example     : select bizz.fn_sum_unity_byday_force('303101', '202201', 'inv', 'N');
						v_month 
						v_sum_type_cd_01	집계유형대분류 : 재고-INV, 고정자산-ACC_FXASET, 회계-ACC, 미청구채권-ACC_RECEIVABLE, 미청구채무-ACC_PAYABLE
						v_by_sum_tf_01 		회계-부서(사용:Y/미사용:N), 미청구채권채무-부서,프로젝트(사용:C/미사용:W), 재고-관리항목(사용:Y/미사용:N)
						v_by_sum_tf_02 		회계-프로젝트(사용:Y/미사용:N) 
						v_user_sid 			사용자고유아이디
						v_bal_stand_dt 		잔액기준월 : 재고, 회계 
						v_refer_sid 		회계-계정별 부서/프로젝트집계여부변경될때 사용하는 조건 '76FDVFKD7SF4NJT'::char(15) 
						v_item_type 		회계-계정별 부서/프로젝트집계여부변경될때 사용하는 조건 'GYE'::varchar(100)
						v_nol4_flag			nol4여부 파라미터 
6. Precaution  :
7. History     : 2023-05-09 (Jaehui) - 직전선분 탐색로직 수정. 인덱스 탐침을 위한 조건변경
				 2023-05-16 (Jaehui) - 삭제 비교로직 수정
				 2023-05-22 (Jaehui) - 멀티선분 활용하도록 로직변경
				 2023-06-08 (Jaehui) - 잘못된 인덱스 타지 못하도록 조건 꺾는 로직 추가, 힌트 alias 변경
				 2023-06-13 (Jaehui) - 이력기록변수 변경
				 2023-06-19 (Seungbeom) - 고정자산 분기 추가, 직전선분 조회 시 select 절의 coalesce 제거 
				 2023-07-21 (Wonhee) - 재고 공통tgt테이블 추가, v_user_sid 파라미터 추가
				 2023-07-27 (Wonhee) - 재고 조회 공통tgt테이블로 변경
				 2023-10-11 (Wonhee) - 재고 이전 tgt테이블 제거
				 2023-11-08 (Wonhee) - 재고 직전선분 잔량과 현재선분 이전잔량을 비교해서 차이금액을 멀티선분 prev_amt_qty에 추가하도록 로직 수정
				 2023-12-08 (Wonhee) - 회계/미청구채권채무 분기 추가
				 2024-01-12 (Wonhee) - 이력기록변수 변경
				 2024-01-23 (Wonhee) - 회계 계정별집계에서 계정 삭제된 경우 로직 추가
				 2024-02-19 (Wonhee) - 관리자계정일 경우 월의 모든 이전잔량 이전잔량 직전선분잔량과 비교하는 로직 추가
				 2024-02-27 (Wonhee) - 계정별집계이면서 손익대체후계정인 경우 update하는 부분 수정
				 2024-03-07 (Wonhee) - 기수내첫선분 직전선분안가져올때 prev값 오류 수정
8. 고부하SP     :
9. OLD SP NAME : (PG) bizz.fn_inv_qty_byday_sum_force
*****************************************************************************/
declare 
		v_nol4_exists_tf boolean := false;						/* 내 sp nol4 버전이 존재하는지 여부 */
		v_is_lock int;
		v_sum_type_cd_02 varchar(20) := 'Q';					/* 집계유형중분류 - 재고 기본값 */
		v_update_rows int = 0;
		v_sum_start_time timestamp := clock_timestamp();        /* 시작시간 체크 */
		v_sum_tgt_sid	char(15); 								/* force강제sid값 */
		v_bizz_sid		char(15); 								/* 업무고유아이디 */
		v_bf_gye_cd varchar(100) ;								/* 회계 - 전기손익대체 전 계정 */
		v_af_gye_cd varchar(100) ;								/* 회계 - 전기손익대체 후 계정 */
		v_sum_type_cd_acc_01 varchar(100) := 'ACC_AC';			/* 회계 - 회계 계정별 집계 */
		v_sum_type_cd_acc_02 varchar(100) := 'ACC_CUST';		/* 회계 - 회계 계정별거래저별 집계 */
		v_item_list text	;									/* 회계 - 계정 리스트*/
		v_bal_stand_next_dt	char(8);							/* 회계 - 잔액기준월+1일 */

-- 트랜젝션 시작
begin
		/*
			2023-03-07 jaehui / 아래 테이블 관련로직은 동적처리 필요
			- bizz.bd_inv_sum_tgt_dt_i
			- bizz.bd_inv_slip_m
		*/
		v_user_sid := coalesce(v_user_sid,'ECOUNT');
		v_bizz_sid := case v_sum_type_cd_01 
							when 	'INV'				then	'B_000000E040701'
							when 	'ACC_FXASET'		then	'B_000000E010619'
							when 	'ACC'				then	'B_000000E010701'
							when 	'ACC_RECEIVABLE'	then	'B_000000E040214'
							when 	'ACC_PAYABLE'		then	'B_000000E040309'
						end;
		v_sum_tgt_sid := RIGHT('000000000000F_',15-CHAR_LENGTH(v_sum_type_cd_01))|| v_sum_type_cd_01;	
		
		if (v_sum_type_cd_01 = 'ACC_FXASET') then /* 고정자산 */
			
			/* 집계 실행시 lock을 잡기 위한 기본데이터 세팅. 데이터가 존재하지 않는 회사코드 기준으로 1회만 발생하는 로직 */
			if not exists (select 1 from bizz.bd_acc_amt_sum_tgt_dt_i where com_code = v_com_code and  sum_tgt_sid = '00000000FORCE_F' ) then
				insert into bizz.bd_acc_amt_sum_tgt_dt_i(com_code, sum_tgt_sid, slip_dt, sum_tgt_type, write_dtm, tgt_dv_cd, sum_status_type)
				values (v_com_code, '00000000FORCE_F', '', '', now(), 'F', 'F')
				on conflict on constraint pk_bd_acc_amt_sum_tgt_dt_i do nothing;
							
			end if;	
				/* 락 획득 (다른 집계 트랜젝션 대기) */	
				select 1 into v_is_lock
				from bizz.bd_acc_amt_sum_tgt_dt_i
				where com_code = v_com_code and tgt_dv_cd = 'F' and (sum_status_type = 'N' or sum_tgt_sid= '00000000FORCE_F' )
				order by sum_tgt_sid asc
				limit 1
				for update;
				
				
				/* tgt에 저장된 대상일자를 진행 중 상태로 변경 */
				update bizz.bd_acc_amt_sum_tgt_dt_i
				set sum_status_type = case when sum_tgt_sid = '00000000FORCE_F' then sum_status_type else 'P' end			/* 일자 정보만 갱신 */
					,	write_dtm 	= case when sum_tgt_sid = '00000000FORCE_F' then now() else write_dtm end				/* 강제집계 정보만 갱신 */
				where com_code = v_com_code and tgt_dv_cd = 'F' 
					and ( (sum_status_type = 'N' and slip_dt like v_month||'%') or (sum_status_type = 'F' and sum_tgt_sid = '00000000FORCE_F') )
					;	
		
		elseif (v_sum_type_cd_01 in ('ACC','ACC_RECEIVABLE','ACC_PAYABLE')) then  /* 공통tgt : 회계/미청구채권/채무 */	
		
			/* bd_sum_unity_tgt_dt_i 추가 insert */
			if not exists (select 1 from bizz.bd_sum_unity_tgt_dt_i where com_code = v_com_code and sum_tgt_sid= v_sum_tgt_sid ) then
					insert into bizz.bd_sum_unity_tgt_dt_i ( com_code, sum_tgt_sid, bizz_sid, slip_dt, sum_tgt_type, sum_status_type, write_dtm, write_sid, update_dtm, update_sid )
					values ( v_com_code, v_sum_tgt_sid, v_bizz_sid, '', '', 'F', now(), 'ECOUNT', now(), 'ECOUNT')
					on conflict on constraint pk_bd_sum_unity_tgt_dt_i do nothing;
			end if;	
			
			/* 락 획득 (다른 집계 트랜젝션 대기) */
			select 1 into v_is_lock
			from bizz.bd_sum_unity_tgt_dt_i
			where com_code = v_com_code and sum_tgt_sid = v_sum_tgt_sid
			order by sum_tgt_sid asc
			limit 1
			for update;
			
			/* ## 기수변경 함수 호출  ###########################################
				회계일때 잔액기준월+1이고 기수초가 아닌경우에 tgt테이블에 'N'으로 넣어주는 로직이 기수변경함수에 있음
				증분집계 전에 호출하기 위해 먼저 추가
			*/
			
			if ( v_sum_type_cd_01 = 'ACC') then
				
				/* 내 sp가 nol4 존재하는지 체크 */
				if v_nol4_flag = true and exists ( 
								select   1 cnt
								from pg_catalog.pg_proc
								join pg_namespace on pg_catalog.pg_proc.pronamespace = pg_namespace.oid
								where proname = 'fn_sum_unity_byday_force_nol4' and pg_namespace.nspname = 'bizz'
						) then
						v_nol4_exists_tf := true;
				end if;
			
				if	v_nol4_exists_tf = true and	exists (
							select   1 cnt
							from pg_catalog.pg_proc
							join pg_namespace on pg_catalog.pg_proc.pronamespace = pg_namespace.oid
							where proname = 'fn_sum_unity_byday_phase_nol4' and pg_namespace.nspname = 'bizz'
						) then
						perform bizz.fn_sum_unity_byday_phase_nol4(v_com_code, v_month, v_sum_type_cd_01, v_bal_stand_dt, v_by_sum_tf_01, v_by_sum_tf_02, v_user_sid, 'FORCE');
				else	
						perform bizz.fn_sum_unity_byday_phase(v_com_code, v_month, v_sum_type_cd_01, v_bal_stand_dt, v_by_sum_tf_01, v_by_sum_tf_02, v_user_sid, 'FORCE');
				end if;
				
			end if;
			/* ## 기수변경 함수 호출 종료 ########################################### */
			
			
			/* 회계/미청구는 계정 조건이 없는 경우 */
			if (v_item_type is null) then
				
				/* bd_sum_unity_tgt_dt_i 추가 update */
				update bizz.bd_sum_unity_tgt_dt_i 
				set sum_status_type = case when sum_tgt_sid = v_sum_tgt_sid then sum_status_type else 'P' end					/* 일자 정보만 갱신*/
					,	update_dtm 	= case when sum_tgt_sid = v_sum_tgt_sid then now() else write_dtm end						/* 강제집계 정보만 갱신 */
					,	update_sid 	= case when sum_tgt_sid = v_sum_tgt_sid then 'ECOUNT' else v_user_sid end					/* 강제집계 정보만 갱신 */
				where com_code = v_com_code 
						/* 집계월에 해당하는 일자정보이거나, 강제 집계이거나 */
						and ( (sum_status_type = 'N' and slip_dt like v_month||'%') or (sum_status_type = 'F' and sum_tgt_sid = v_sum_tgt_sid) )
						and bizz_sid = v_bizz_sid
				;
				
			end if;	
			
		elseif (v_sum_type_cd_01 = 'INV') then  /* 재고 */
			/* 강제집계 시 lock 잡기위한 데이터 insert. 강제집계는 파라미터 변경 및 삭제를 하지 않으며, 강제집계 시 write_dtm만 갱신 */
			if not exists (select 1 from bizz.bd_sum_unity_tgt_dt_i where com_code = v_com_code and sum_tgt_sid= v_sum_tgt_sid ) then
					insert into bizz.bd_sum_unity_tgt_dt_i ( com_code, sum_tgt_sid, bizz_sid, slip_dt, sum_tgt_type, sum_status_type, write_dtm, write_sid, update_dtm, update_sid )
					values ( v_com_code, v_sum_tgt_sid, v_bizz_sid, '', '', 'F', now(), 'ECOUNT', now(), 'ECOUNT')
					on conflict on constraint pk_bd_sum_unity_tgt_dt_i do nothing;
			end if;	

			/* 락 획득 (다른 집계 트랜젝션 대기) */
			select 1 into v_is_lock
			from bizz.bd_sum_unity_tgt_dt_i
			where com_code = v_com_code and sum_tgt_sid = v_sum_tgt_sid
			order by sum_tgt_sid asc
			limit 1
			for update;
		
			/*진행중 상태로 변경*/
			update bizz.bd_sum_unity_tgt_dt_i 
			set sum_status_type = case when sum_tgt_sid = v_sum_tgt_sid then sum_status_type else 'P' end					/* 일자 정보만 갱신*/
				,	update_dtm 	= case when sum_tgt_sid = v_sum_tgt_sid then now() else write_dtm end						/* 강제집계 정보만 갱신 */
				,	update_sid 	= case when sum_tgt_sid = v_sum_tgt_sid then 'ECOUNT' else v_user_sid end					/* 강제집계 정보만 갱신 */
			where com_code = v_com_code 
					/* 집계월에 해당하는 일자정보이거나, 강제 집계이거나 */
					and ( (sum_status_type = 'N' and slip_dt like v_month||'%') or (sum_status_type = 'F' and sum_tgt_sid = v_sum_tgt_sid) )
					and bizz_sid = v_bizz_sid
			;
			
		end if;

		/* 추가 변수 설정 */
		if (v_sum_type_cd_01 = 'ACC') then /* 회계 */
			
			/* 잔액기준월 변수 */
			v_bal_stand_dt := to_char(to_date(left(v_bal_stand_dt, 6), 'yyyymm') + interval '1 month' - interval '1 day', 'yyyymmdd');
			v_bal_stand_next_dt := to_char(to_date(v_bal_stand_dt,'YYYYMMDD') + interval '1 day', 'YYYYMMDD');
			
			v_by_sum_tf_01 := coalesce(v_by_sum_tf_01,'N');		/* 부서 */
			v_by_sum_tf_02 := coalesce(v_by_sum_tf_02,'N');		/* 프로젝트 */	

			
			/* 전기손익대체 전/후 계정 */			
			select sbt_bef_gye_cd, sbt_afte_gye_cd into v_bf_gye_cd, v_af_gye_cd
			from base.acac_auto_sbt_set
			where com_code = v_com_code and auto_sbt_tpcd = 6;
			
			v_bf_gye_cd := coalesce(v_bf_gye_cd,'');
			v_af_gye_cd := coalesce(v_af_gye_cd,'');
		
		elseif (v_sum_type_cd_01 in ('ACC_RECEIVABLE','ACC_PAYABLE')) then  /* 미청구채권/채무 */	
			
			v_sum_type_cd_02 := 'W';							/* 집계유형중분류 */
			v_by_sum_tf_01 := coalesce(v_by_sum_tf_01,'C');		/* 부서/프로젝트 */
			
		end if;		
		
		/* ## 1) 일선분 생성 ############################################## */

		/* 대상을 임시테이블에 저장. 복제하는 과정에서 데이터 순서 변경될 수 있으므로 데이터 추출하여 임시테이블에 저장 */
		drop table if exists tmp_upsert_n;
		create temporary table tmp_upsert_n
		(
				com_code		varchar(6)
			,	sum_type_cd_01	varchar(20)
			,	sum_type_cd_02	varchar(20)
			,	prod_cd			varchar(100)
			,	gye_code		varchar(100)
			,	mgnt_item_no	varchar(100)
			,	cust_cd			varchar(100)
			,	wh_cd			varchar(100)
			,	site_cd			varchar(100)
			,	pjt_cd			varchar(100)
			,	start_dt		char(8)
			,	end_dt			char(8)
			,	prev_amt_qty	numeric(28, 10)
			,	inc_amt_qty		numeric(28, 10)
			,	dec_amt_qty		numeric(28, 10)
			,	bal_amt_qty		numeric(28, 10)
			,	status_type		char(1)
		) on commit drop;
		create index ix_tmp_upsert_n_01 on tmp_upsert_n ( status_type );

		/*
		###############################################################################################################################
		회계 집계 순서(102/105)
		1) 잔액기준월+1인 경우 > 계정별, 계정별거래저별 동시에 집계함
		2) 집계공통 - 계정별거래저별
		3) 추가집계공통 - 계정별 (이유:전기손익대체 로직 추가)
		4) 관리자계정일때 기준월 이전잔량 직전선분잔량과 비교하기
		###############################################################################################################################
		
		###############################################################################################################################
		그 외 집계 순서(재고, 고정자산, 미청구)
		1) 집계공통
		2) 관리자계정일때 기준월 이전잔량 직전선분잔량과 비교하기
		###############################################################################################################################
		*/
		
		/*
		###############################################################################################################################
		잔액기준월+1월인 경우
		잔액기준월집계에서 bal_amt_qty를 (집계기준은 부서/프로젝트집계여부회사설정 사용)와 잔액기준월+1월 prev_amt_qty를 비교
		잔액이 다르면 멀티선분으로 insert/update
		잔액이 같으면 유지
		###############################################################################################################################
		*/
		if ( left(v_bal_stand_next_dt,6) = v_month and v_sum_type_cd_01 = 'ACC' ) then
			
			with prev_byday_g 
			as (
					/* 현재 집계기준 - 잔액기준월의 잔액 데이터 수집 */
					/* 102 집계 (계정별) */
					select  
						prev_byday.com_code, prev_byday.sum_type_cd_01, prev_byday.sum_type_cd_02
							, prev_byday.prod_cd, prev_byday.gye_code, prev_byday.mgnt_item_no, prev_byday.cust_cd, prev_byday.wh_cd
							, ( case when v_by_sum_tf_02 = 'Y' then prev_byday.pjt_cd else '00' end ) pjt_cd
							, ( case when v_by_sum_tf_01 = 'Y' then prev_byday.site_cd else '00' end ) site_cd
							, sum(bal_amt_qty) bal_amt_qty
					from bizz.bd_sum_unity_byday_s prev_byday
					where prev_byday.com_code = v_com_code and sum_type_cd_01 = v_sum_type_cd_acc_01 and to_char(to_date(v_month,'YYYYMM') - interval '1 day', 'YYYYMMDD')::char(8)  between prev_byday.start_dt and prev_byday.end_dt
					/* 특정 계정만 추가 */
					and case when v_item_type is not null then false else true end
					group by prev_byday.com_code, prev_byday.sum_type_cd_01, prev_byday.sum_type_cd_02
							, prev_byday.prod_cd, prev_byday.gye_code, prev_byday.mgnt_item_no, prev_byday.cust_cd, prev_byday.wh_cd
							, ( case when v_by_sum_tf_02 = 'Y' then prev_byday.pjt_cd else '00' end )
							, ( case when v_by_sum_tf_01 = 'Y' then prev_byday.site_cd else '00' end )
					having sum(bal_amt_qty) <> 0
					
					union all
					
					/* 105 집계 (계정별거래저별) */
					select  
						prev_byday.com_code, prev_byday.sum_type_cd_01, prev_byday.sum_type_cd_02
							, prev_byday.prod_cd, prev_byday.gye_code, prev_byday.mgnt_item_no, prev_byday.cust_cd, prev_byday.wh_cd
							, ( case when a2.acc105_pjt = true and v_by_sum_tf_02 = 'Y' then prev_byday.pjt_cd 
									when a2.acc105_pjt is null and v_by_sum_tf_02 = 'Y' then prev_byday.pjt_cd
									else '00' end ) pjt_cd
							, ( case when a2.acc105_site = true and v_by_sum_tf_01 = 'Y' then prev_byday.site_cd 
									when a2.acc105_site is null and v_by_sum_tf_01 = 'Y' then prev_byday.site_cd
									else '00' end ) site_cd
							, sum(bal_amt_qty) bal_amt_qty
					from bizz.bd_sum_unity_byday_s prev_byday
					inner join base.acc002 a2
							ON  a2.com_code = v_com_code
							and prev_byday.com_code = a2.com_code 
							and prev_byday.gye_code = a2.gye_code
							and a2.input_gubun = 'Y' 
							and a2.sum_gubun = '2'  /*거래처별 집계, 전표입력계정인 경우만 102집계*/
					where prev_byday.com_code = v_com_code and sum_type_cd_01 = v_sum_type_cd_acc_02 and to_char(to_date(v_month,'YYYYMM') - interval '1 day', 'YYYYMMDD')::char(8)  between prev_byday.start_dt and prev_byday.end_dt
					/* 특정 계정만 추가 */
					and case when v_item_type is not null
							then prev_byday.gye_code = any(array(select add_cd_01 from bizz.tm_bas_cd_i where refer_sid = v_refer_sid and item_type = 'GYE' and com_code = v_com_code)) 
						else true end
					group by prev_byday.com_code, prev_byday.sum_type_cd_01, prev_byday.sum_type_cd_02
							, prev_byday.prod_cd, prev_byday.gye_code, prev_byday.mgnt_item_no, prev_byday.cust_cd, prev_byday.wh_cd
							, ( case when a2.acc105_pjt = true and v_by_sum_tf_02 = 'Y' then prev_byday.pjt_cd 
									when a2.acc105_pjt is null and v_by_sum_tf_02 = 'Y' then prev_byday.pjt_cd
									else '00' end ) 
							, ( case when a2.acc105_site = true and v_by_sum_tf_01 = 'Y' then prev_byday.site_cd 
									when a2.acc105_site is null and v_by_sum_tf_01 = 'Y' then prev_byday.site_cd
									else '00' end ) 
					having sum(bal_amt_qty) <> 0
							
			),
			byday_g 
			as (
					/* 기존 집계기준 - 잔액기준월+1의 이전잔액 데이터 수집 */
					select 
						byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd
							, byday.pjt_cd	, byday.site_cd
							, sum(case when byday.start_dt = to_char(to_date(v_month,'YYYYMM'), 'YYYYMMDD')::char(8) then prev_amt_qty else bal_amt_qty end) bal_amt_qty
					from bizz.bd_sum_unity_byday_s byday
					where byday.com_code = v_com_code and sum_type_cd_01 in (v_sum_type_cd_acc_01,v_sum_type_cd_acc_02) and to_char(to_date(v_month,'YYYYMM'), 'YYYYMMDD')::char(8)  between byday.start_dt and byday.end_dt
					/* 특정 계정만 추가 */
					and case when v_item_type is not null
							then sum_type_cd_01 = v_sum_type_cd_acc_02
								and byday.gye_code = any(array(select add_cd_01 from bizz.tm_bas_cd_i where refer_sid = v_refer_sid and item_type = 'GYE' and com_code = v_com_code)) 
						else true end
					group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd
							, byday.pjt_cd	, byday.site_cd
					having sum(case when byday.start_dt = to_char(to_date(v_month,'YYYYMM'), 'YYYYMMDD')::char(8) then prev_amt_qty else bal_amt_qty end) <> 0
					
			)
			insert 	/*+ HashJoin(byday_g prev_byday_g) */
			into tmp_upsert_n
			select	byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02, byday.prod_cd
				, case	when byday.copy_sno = 2 then v_af_gye_cd else byday.gye_code end gye_code
				, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
				, case	when byday.copy_sno = 2 then to_char(to_date(date_t,'YYYYMM') + interval '1 month','YYYYMMDD')
						else to_char(to_date(v_month,'YYYYMM'), 'YYYYMMDD') end start_dt
				/* 이월되지 않는 계정들은 해당기수 말일로 종료일 고정. 나머지 계정들(이월O) 99991231 */
				,case 	when byday.sum_type_cd_01 = v_sum_type_cd_acc_02 then '99991231'::char(8) 
						when byday.gye_type not in ('AS','DE','CP') or (byday.copy_sno = 1 and byday.gye_code = v_bf_gye_cd) then coalesce(to_char(to_date(byday.date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
						else '99991231'::char(8) 
				 end  as end_dt
				, prev_qty - byday_qty prev_amt_qty					
				, 0 inc_amt_qty, 0 dec_amt_qty
				, prev_qty - byday_qty  bal_amt_qty	/* 월prev잔량에서 월잔량을 뺀 결과 */			
				/* 원가/손익계정일때  */
				, case when (byday.copy_sno = 2)   
					/* 손익대체 예외로직 */
					and 0 <> (select count(*) cnt
							from bizz.bd_sum_unity_byday_s byday_sub
							where byday_sub.com_code = v_com_code 
								and byday_sub.sum_type_cd_01 = v_sum_type_cd_acc_01
								and byday.sum_type_cd_01 = byday_sub.sum_type_cd_01
								and byday.sum_type_cd_02 = byday_sub.sum_type_cd_02
								and coalesce(byday.prod_cd, '') = coalesce(byday_sub.prod_cd, '')
								and v_af_gye_cd = coalesce(byday_sub.gye_code, '')
								and coalesce(byday.mgnt_item_no, '') = coalesce(byday_sub.mgnt_item_no, '')
								and coalesce(byday.cust_cd, '') = coalesce(byday_sub.cust_cd, '')
								and coalesce(byday.wh_cd, '') = coalesce(byday_sub.wh_cd, '')
								and coalesce(byday.site_cd, '') = coalesce(byday_sub.site_cd, '')
								and coalesce(byday.pjt_cd, '') = coalesce(byday_sub.pjt_cd, '')
								and to_char(to_date(date_t,'YYYYMM') + interval '1 month','YYYYMMDD')::char(8) = byday_sub.start_dt
								and '99991231'::char(8) = byday_sub.end_dt 
							) then 'U'
					/* 원가1,2,3,손익 예외로직 */
						when byday_sub.max_end_dt 
							= ( case 	when byday.sum_type_cd_01 = v_sum_type_cd_acc_01 and byday.gye_type not in ('AS','DE','CP') or byday.gye_code = v_bf_gye_cd then coalesce(to_char(to_date(byday.date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
											else '99991231'::char(8) end
							) then 'U' 
						else 'I' end status_type
			from (
				select byday.*
					, cm.copy_sno, a2.gye_type, ph.date_t
				from (
						select
								coalesce(prev_byday_g.com_code, byday_g.com_code) com_code
							, 	coalesce(prev_byday_g.sum_type_cd_01, byday_g.sum_type_cd_01) sum_type_cd_01
							, 	coalesce(prev_byday_g.sum_type_cd_02, byday_g.sum_type_cd_02) sum_type_cd_02
							, 	coalesce(prev_byday_g.prod_cd, byday_g.prod_cd) prod_cd
							, 	coalesce(prev_byday_g.gye_code, byday_g.gye_code) gye_code
							, 	coalesce(prev_byday_g.mgnt_item_no, byday_g.mgnt_item_no) mgnt_item_no
							, 	coalesce(prev_byday_g.cust_cd, byday_g.cust_cd) cust_cd
							, 	coalesce(prev_byday_g.wh_cd, byday_g.wh_cd) wh_cd
							, 	coalesce(prev_byday_g.site_cd, byday_g.site_cd) site_cd
							, 	coalesce(prev_byday_g.pjt_cd, byday_g.pjt_cd) pjt_cd
							,	coalesce(byday_g.bal_amt_qty,0) byday_qty
							, 	coalesce(prev_byday_g.bal_amt_qty,0) prev_qty
						from prev_byday_g
						full outer join byday_g
						on byday_g.com_code = prev_byday_g.com_code
								and byday_g.sum_type_cd_01 = prev_byday_g.sum_type_cd_01
								and byday_g.sum_type_cd_02 = prev_byday_g.sum_type_cd_02
								and coalesce(byday_g.prod_cd, '') = coalesce(prev_byday_g.prod_cd, '')
								and coalesce(byday_g.gye_code, '') = coalesce(prev_byday_g.gye_code, '')
								and coalesce(byday_g.mgnt_item_no, '') = coalesce(prev_byday_g.mgnt_item_no, '')
								and coalesce(byday_g.cust_cd, '') = coalesce(prev_byday_g.cust_cd, '')
								and coalesce(byday_g.wh_cd, '') = coalesce(prev_byday_g.wh_cd, '')
								and coalesce(byday_g.site_cd, '') = coalesce(prev_byday_g.site_cd, '')
								and coalesce(byday_g.pjt_cd, '') = coalesce(prev_byday_g.pjt_cd, '')
						where	coalesce(byday_g.bal_amt_qty,0) <> coalesce(prev_byday_g.bal_amt_qty,0) 
				) byday 
				left join base.cm_copy_m as cm /* 전기손익대체 BF계정의 증가분을 다음기수 1일의 이월잔액/잔액으로 이월시킴 */
					on cm.copy_sno <= 2 and v_bf_gye_cd = byday.gye_code and byday.sum_type_cd_01 = v_sum_type_cd_acc_01
				left join base.acc002 a2
					on a2.com_code = v_com_code and a2.com_code = byday.com_code and a2.gye_code = byday.gye_code and byday.sum_type_cd_01 = v_sum_type_cd_acc_01 
				left join base.acc001_phase ph
					on ph.com_code = v_com_code and ph.com_code = byday.com_code and v_month between ph.date_f and ph.date_t and byday.sum_type_cd_01 = v_sum_type_cd_acc_01
				/* 102이고 잔액기준월+1이 기수 초일 경우 자산,자본,부채가 아닌 경우 or 이전손익대체계정인 경우 잔액비교 제외하기 */
				where case when byday.sum_type_cd_01 = v_sum_type_cd_acc_01 and left(v_bal_stand_next_dt,6) = ph.date_f
						then a2.gye_type in ('AS','DE','CP') and byday.gye_code not in (v_bf_gye_cd, v_af_gye_cd) 
					else true end
				
			) byday
			left join lateral (	
				select /* max_end_dt는 기수여부에 따라서 저장 */
					max(case 	when byday_sub.sum_type_cd_01 = v_sum_type_cd_acc_01 
										and (byday.gye_type not in ('AS','DE','CP') or byday_sub.gye_code = v_bf_gye_cd) 
										and byday_sub.end_dt > coalesce(to_char(to_date(byday.date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
								then '19000101'::char(8) 
							else byday_sub.end_dt
					 end) as max_end_dt
				from bizz.bd_sum_unity_byday_s byday_sub
				where byday_sub.com_code = v_com_code
					and byday_sub.sum_type_cd_01 in (v_sum_type_cd_acc_01,v_sum_type_cd_acc_02) 
					and byday.sum_type_cd_01 = byday_sub.sum_type_cd_01
					and byday.sum_type_cd_02 = byday_sub.sum_type_cd_02
					and coalesce(byday.prod_cd, '') = coalesce(byday_sub.prod_cd, '')
					and coalesce(byday.gye_code, '') = coalesce(byday_sub.gye_code, '')
					and coalesce(byday.mgnt_item_no, '') = coalesce(byday_sub.mgnt_item_no, '')
					and coalesce(byday.cust_cd, '') = coalesce(byday_sub.cust_cd, '')
					and coalesce(byday.wh_cd, '') = coalesce(byday_sub.wh_cd, '')
					and coalesce(byday.site_cd, '') = coalesce(byday_sub.site_cd, '')
					and coalesce(byday.pjt_cd, '') = coalesce(byday_sub.pjt_cd, '')
					and byday_sub.start_dt = to_char(to_date(v_month,'YYYYMM'), 'YYYYMMDD')::char(8)
			) byday_sub on true
			;
			
			/* bal_amt_qty 차액만 insert하기 */
			insert into bizz.bd_sum_unity_byday_s
			( com_code, sum_type_cd_01, sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty, segl_rev_tgt_tf )
			select com_code, sum_type_cd_01, sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty, true segl_rev_tgt_tf
			from tmp_upsert_n
			where status_type = 'I';
			
			/* prev_amt_qty 잔액기준월bal값만 update하기 */
			update 	/*+  NestLoop(tgt byday) Leading(tgt byday) IndexScan(byday uk_bd_sum_unity_byday_s_02) */
					bizz.bd_sum_unity_byday_s byday
			set		prev_amt_qty = byday.prev_amt_qty + tmp.prev_amt_qty
				,	bal_amt_qty	= byday.bal_amt_qty + tmp.bal_amt_qty  
			from (
					select com_code,sum_type_cd_01,sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty
					from tmp_upsert_n tgt
					where status_type = 'U'
			) tmp
			where	byday.com_code = v_com_code 
					/* 회계는 변수 2개임으로 제거 */
					and byday.sum_type_cd_01 in (v_sum_type_cd_acc_01,v_sum_type_cd_acc_02)
					-- and byday.start_dt = to_char(to_date(v_month,'YYYYMM'), 'YYYYMMDD')::char(8)
					and byday.com_code = tmp.com_code 
					and byday.sum_type_cd_01 = tmp.sum_type_cd_01 and byday.sum_type_cd_02 = tmp.sum_type_cd_02
					and coalesce(byday.prod_cd, '') = coalesce(tmp.prod_cd, '')
					and coalesce(byday.gye_code, '') = coalesce(tmp.gye_code, '')
					and coalesce(byday.mgnt_item_no, '') = coalesce(tmp.mgnt_item_no, '')
					and coalesce(byday.cust_cd, '') = coalesce(tmp.cust_cd, '')
					and coalesce(byday.wh_cd, '') = coalesce(tmp.wh_cd, '')
					and coalesce(byday.site_cd, '') = coalesce(tmp.site_cd, '')
					and coalesce(byday.pjt_cd, '') = coalesce(tmp.pjt_cd, '')
					and byday.start_dt = tmp.start_dt
					and byday.end_dt||'' = tmp.end_dt
			;
			
			delete from tmp_upsert_n;
			
		end if;
		
		/* 회계 계정별거래처별기준으로 변경 */
		if (v_sum_type_cd_01 = 'ACC') then 
			v_sum_type_cd_01 = 'ACC_CUST';
		end if;
		
		/* 2023-05-22 (Jaehui) - 기존 멀티선분을 제외하고 재계산하는 로직을, 해당월 전체 일자 기준으로 차이데이터 멀티선분 생성하는 형태로 로직 수정 */
		/*
		###############################################################################################################################
		공통 (회계 계정별거래처별 포함)
		###############################################################################################################################
		*/
		
		with byday_g 
		as (
				/* 간소화집계를 포함한 일집계 데이터 수집 */
				select  /*+ HashJoin(byday_g slip_g) */ 
					byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
						, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd, byday.start_dt
						, sum(inc_amt_qty) inc_amt_qty, sum(dec_amt_qty) dec_amt_qty, max(byday.end_dt) max_end_dt
						, sum(prev_amt_qty) prev_amt_qty /* 이전잔량 저장 */		, min(segl_rev_tgt_tf::int)::boolean min_segl_rev_tgt_tf /* 본선분여부 */
				from bizz.bd_sum_unity_byday_s byday
				where byday.com_code = v_com_code and sum_type_cd_01 = v_sum_type_cd_01 and byday.start_dt like v_month||'%'
					/* 특정 계정만 추가 */
					and case when v_sum_type_cd_01 = v_sum_type_cd_acc_02 and v_item_type is not null
							then byday.gye_code = any(array(select add_cd_01 from bizz.tm_bas_cd_i where refer_sid = v_refer_sid and item_type = 'GYE' and com_code = v_com_code)) 
						else true end
				group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
						, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd, byday.start_dt
		),
		slip_g 
		as (
				select slip.com_code, v_sum_type_cd_01 sum_type_cd_01, v_sum_type_cd_02 sum_type_cd_02
						, slip.prod_cd, null gye_code, slip.item_cd mgnt_item_no, null cust_cd, slip.wh_cd, null site_cd, null pjt_cd, slip.slip_dt start_dt
						, sum(in_qty)::numeric(28,10) inc_amt_qty, sum(out_qty)::numeric(28,10) dec_amt_qty
				from (
						/* 전표 데이터 수집 */
						select 	slip.com_code, slip.prod_cd, slip.wh_cd, case when v_by_sum_tf_01 = 'Y' then slip.item_cd else '00' end item_cd, slip.slip_dt
								, case when inout_type = 'I' then qty else 0 end in_qty
								, case when inout_type = 'O' then qty else 0 end out_qty
						from bizz.bd_inv_slip_m as slip
						where 	slip.com_code = v_com_code and slip.slip_dt like v_month||'%'
								and slip.inv_slip_type in ('1', '2', '4', '47', '59', '5', '6', '58', '31', '32')
								/* 1:판매, 2:구매, 4:생산, 47:소모, 59:자가사용, 5:불량처리(BAD), 6:불량처리(BADCHANGE), 58:재고조정, 31:창고이동, 32:생산불출 */								
				) slip 
				where v_sum_type_cd_01 = 'INV'  /* 재고잔량집계에서만 조회하도록*/
				group by slip.com_code, slip.prod_cd, slip.wh_cd, slip.item_cd, slip.slip_dt
				having sum(in_qty) <> 0 or sum(out_qty) <> 0
				
				union all
				
				select slip.com_code, v_sum_type_cd_01 sum_type_cd_01, add_sum_item_type sum_type_cd_02
						, null prod_cd, null gye_code, slip.manage_item_no mgnt_item_no, null cust_cd, null wh_cd, null site_cd, null pjt_cd, slip.slip_dt start_dt
						, sum(inc_amt)::numeric(28,10) inc_amt_qty, sum(dec_amt)::numeric(28,10) dec_amt_qty
				from (	
						/* 전표 데이터 수집 */
						select 	slip.com_code, slip.manage_item_no, slip.slip_dt
							, case when cm.copy_sno = 1 then 'C' 
								   when cm.copy_sno = 2 then 'D'
								   when cm.copy_sno = 3 then 'Q' 
								   end as add_sum_item_type	   
							, case  when cm.copy_sno = 1 then sum(case when slip.incdec_type = 'I' then coalesce(slip.amt_qty_01, 0) else 0 end)
									when cm.copy_sno = 2 then sum(case when slip.incdec_type = 'I' then coalesce(slip.amt_qty_02, 0)else 0 end)
									when cm.copy_sno = 3 then sum(case when slip.incdec_type = 'I' then coalesce(slip.amt_qty_03, 0)else 0 end) 
									end as inc_amt
							, case  when cm.copy_sno = 1 then sum(case when slip.incdec_type = 'D' then coalesce(slip.amt_qty_01, 0) else 0 end)
									when cm.copy_sno = 2 then sum(case when slip.incdec_type = 'D' then coalesce(slip.amt_qty_02, 0)else 0 end)
									when cm.copy_sno = 3 then sum(case when slip.incdec_type = 'D' then coalesce(slip.amt_qty_03, 0)else 0 end) 
									end as dec_amt		
						from bizz.bd_acc_add_inout_slip_t as slip
						join base.cm_copy_m as cm
							on cm.copy_sno <= 3
						where slip.com_code = v_com_code 
							and slip.slip_dt like v_month||'%'
							and slip.status_type = 'U'
							and slip.bizz_sid = 'B_000000E010619'
						group by slip.com_code, cm.copy_sno, slip.manage_item_no, slip.slip_dt
				) slip
				where v_sum_type_cd_01 = 'ACC_FXASET'
				group by slip.com_code, slip.add_sum_item_type, slip.manage_item_no, slip.slip_dt
				having sum(inc_amt) <> 0 or sum(dec_amt) <> 0
				
				union all
				
				/* 105 집계 (계정별거래처별) */
				select slip.com_code, v_sum_type_cd_acc_02 sum_type_cd_01, slip.add_sum_item_type sum_type_cd_02
						, null prod_cd, slip.gye_code gye_code, null mgnt_item_no, cust cust_cd, null wh_cd, slip.site site_cd, slip.pjt_cd pjt_cd, slip.slip_dt start_dt
						, sum(inc_amt)::numeric(28,10) inc_amt_qty, sum(dec_amt)::numeric(28,10) dec_amt_qty
				from (	
						/* 전표 데이터 수집 */
						select 	slip.com_code, slip.gye_code, coalesce(slip.cust, '') cust
						, ( case when a2.acc105_pjt = true and v_by_sum_tf_02 = 'Y' then slip.pjt_cd 
									when a2.acc105_pjt is null and v_by_sum_tf_02 = 'Y' then slip.pjt_cd
									else '00' end ) pjt_cd
						, ( case when a2.acc105_site = true and v_by_sum_tf_01 = 'Y' then slip.site 
									when a2.acc105_site is null and v_by_sum_tf_01 = 'Y' then slip.site
									else '00' end ) site
						, slip.slip_dt
						, case 	when cm.copy_sno = 1 then 'W' 
								when cm.copy_sno = 2 then 'F'
								end as add_sum_item_type	   
						, case  when cm.copy_sno = 1 then sum(case when slip.drcr_type = 'D' then coalesce(slip.amt, 0) else 0 end)
								when cm.copy_sno = 2 then sum(case when slip.drcr_type = 'D' then coalesce(slip.fc_amt, 0)else 0 end)
								end as inc_amt /* 차변 */
						, case  when cm.copy_sno = 1 then sum(case when slip.drcr_type = 'C' then coalesce(slip.amt, 0) else 0 end)
								when cm.copy_sno = 2 then sum(case when slip.drcr_type = 'C' then coalesce(slip.fc_amt, 0)else 0 end)
								end as dec_amt /* 대변 */	
						from bizz.bd_acc_journl_m as slip
						join base.acc002 a2
							ON  a2.com_code = v_com_code 
							and slip.com_code = a2.com_code 
							and slip.gye_code = a2.gye_code
							and a2.input_gubun = 'Y' 
							and a2.sum_gubun = '2'  /*거래처별 집계, 전표입력계정인 경우만 105집계*/
						join base.cm_copy_m as cm
							on cm.copy_sno <= 2
						where slip.com_code = v_com_code 
							and slip.slip_dt like v_month||'%'
							and slip.status_type = 'U'
							and slip.gb_type = 'Y'
							and slip.acc_slip_type in ('A','C')
							/* 특정 계정만 추가 */
							and case when v_item_type is not null
									then slip.gye_code = any(array(select add_cd_01 from bizz.tm_bas_cd_i where refer_sid = v_refer_sid and item_type = 'GYE' and com_code = v_com_code)) 
								else true end
						group by slip.com_code, cm.copy_sno, slip.gye_code, coalesce(slip.cust, ''), slip.pjt_cd, slip.site, slip.slip_dt, a2.acc105_pjt, a2.acc105_site
				) slip
				where v_sum_type_cd_01 = v_sum_type_cd_acc_02
				group by slip.com_code, slip.gye_code, slip.cust, slip.pjt_cd, slip.site, slip.slip_dt, slip.add_sum_item_type
				having sum(inc_amt) <> 0 or sum(dec_amt) <> 0 
				
				union all
				
				/* 미청구채권/채무 집계 */
				select slip.com_code, v_sum_type_cd_01 sum_type_cd_01, v_sum_type_cd_02 sum_type_cd_02
						, null prod_cd, slip.gye_code gye_code, null mgnt_item_no, cust cust_cd, null wh_cd, slip.site site_cd, slip.pjt_cd pjt_cd, slip.slip_dt start_dt
						, sum(inc_amt)::numeric(28,10) inc_amt_qty, sum(dec_amt)::numeric(28,10) dec_amt_qty
				from (
						/* 전표 데이터 수집 */
						select 	slip.com_code, slip.gye_code, slip.cust
						, ( case when v_by_sum_tf_01 = 'W' then slip.pjt_cd else '00' end ) pjt_cd
						, ( case when v_by_sum_tf_01 = 'W' then slip.site else '00' end ) site
						, slip.slip_dt	   
						, (	case when slip.drcr_type = 'D' then coalesce(slip.amt, 0) else 0 end ) as inc_amt /* 차변 */
						, (	case when slip.drcr_type = 'C' then coalesce(slip.amt, 0) else 0 end ) as dec_amt /* 대변 */	
						from bizz.bd_acc_journl_m as slip
						where slip.com_code = v_com_code 
							and slip.slip_dt like v_month||'%'
							and slip.status_type = 'U'
							and slip.gb_type = 'Y'
							and slip.acc_slip_type in ('X','S','J') /* 임시,상계,조정전표 */
							and case when v_sum_type_cd_01 = 'ACC_RECEIVABLE' then slip.gye_code in ('ECOUNT01','ECOUNT03','ECOUNT04')
										when v_sum_type_cd_01 = 'ACC_PAYABLE' then slip.gye_code in ('ECOUNT05','ECOUNT07','ECOUNT08') end
				) slip 
				where v_sum_type_cd_01 in ('ACC_RECEIVABLE','ACC_PAYABLE')  /* 미청구채권/채무집계에서만 조회하도록*/
				group by slip.com_code, slip.gye_code, slip.cust, slip.pjt_cd, slip.site, slip.slip_dt
				having sum(inc_amt) <> 0 or sum(dec_amt) <> 0
				
		)
		insert	into tmp_upsert_n
		select 	byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
				, byday.start_dt, '99991231'::char(8) end_dt
				/* 회계이고 직전선분 prev_start_dt 잔액기준월+1이전이면 0 아니면 prev값 비교 */
				, case when v_sum_type_cd_01 = v_sum_type_cd_acc_02 and v_bal_stand_next_dt::char(8) > prev_byday.prev_start_dt
							then 0::numeric(28,10)  /* 증분집계에서 반영한 데이터는 기본적으로 간소화집계 */
					else coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) /* 멀티선분을 포함한 시작일자의 이전잔액이 직전선분(본선분만)의 잔량과 다르면 차액 추가 */
					end prev_amt_qty	
				, slip_inc_amt - byday_inc_amt inc_amt_qty, slip_dec_amt - byday_dec_amt dec_amt_qty
				/* 	1) 회계, 직전선분이 잔액기준월+1보다 작음, 차변성격인 경우 - 증감에 대한 잔량계산
					2) 회계, 직전선분이 잔액기준월+1보다 작음, 대변성격인 경우 - 증감에 대한 잔량계산*-1
					3) 회계, 대변성격인 경우 - 이전잔량차이 + 증감에 대한 잔량계산*-1
					4) 미청구, 대변성격인 경우 - 이전잔량차이 + 증감에 대한 잔량계산*-1
					그외) - 이전잔량차이 + 증감에 대한 잔량계산
				*/ 
				, case 	when v_sum_type_cd_01 = v_sum_type_cd_acc_02 and v_bal_stand_next_dt::char(8) > prev_byday.prev_start_dt and (select cr_dr from base.acc002 where com_code = v_com_code and byday.gye_code = gye_code)='DR' 
								then (slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt)
						when v_sum_type_cd_01 = v_sum_type_cd_acc_02 and v_bal_stand_next_dt::char(8) > prev_byday.prev_start_dt and (select cr_dr from base.acc002 where com_code = v_com_code and byday.gye_code = gye_code)='CR' 
								then ((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))*(-1)
						when v_sum_type_cd_01 = v_sum_type_cd_acc_02 and (select cr_dr from base.acc002 where com_code = v_com_code and byday.gye_code = gye_code)='CR' 
								then coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) + (((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))*(-1))
						when v_sum_type_cd_01 in ('ACC_RECEIVABLE','ACC_PAYABLE') and byday.gye_code in ('ECOUNT03','ECOUNT05','ECOUNT08') /* 미쳥구일때 대변속성인 경우 */
								then coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) + (((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))*(-1)) 
						else coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) + ((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))
					end bal_amt_qty
				, case when max_end_dt is null or max_end_dt <> '99991231'::char(8) then 'I' else 'U' end status_type
		from (
				/* tgt일자에 해당하는 일집계/전표 데이터 비교 */
				select
						coalesce(slip_g.com_code, byday_g.com_code) com_code
					, 	coalesce(slip_g.sum_type_cd_01, byday_g.sum_type_cd_01) sum_type_cd_01
					, 	coalesce(slip_g.sum_type_cd_02, byday_g.sum_type_cd_02) sum_type_cd_02
					, 	coalesce(slip_g.prod_cd, byday_g.prod_cd) prod_cd
					, 	coalesce(slip_g.gye_code, byday_g.gye_code) gye_code
					, 	coalesce(slip_g.mgnt_item_no, byday_g.mgnt_item_no) mgnt_item_no
					, 	coalesce(slip_g.cust_cd, byday_g.cust_cd) cust_cd
					, 	coalesce(slip_g.wh_cd, byday_g.wh_cd) wh_cd
					, 	coalesce(slip_g.site_cd, byday_g.site_cd) site_cd
					, 	coalesce(slip_g.pjt_cd, byday_g.pjt_cd) pjt_cd
					, 	coalesce(slip_g.start_dt, byday_g.start_dt) start_dt
					,	coalesce(byday_g.inc_amt_qty, 0) byday_inc_amt, coalesce(byday_g.dec_amt_qty, 0) byday_dec_amt
					, 	coalesce(slip_g.inc_amt_qty, 0) slip_inc_amt, coalesce(slip_g.dec_amt_qty, 0) slip_dec_amt
					,	byday_g.max_end_dt
					,	byday_g.prev_amt_qty	/* 이전잔량 저장 */
					,	byday_g.min_segl_rev_tgt_tf	
				from byday_g
				full outer join slip_g
				on byday_g.com_code = slip_g.com_code
						and byday_g.sum_type_cd_01 = slip_g.sum_type_cd_01
						and byday_g.sum_type_cd_02 = slip_g.sum_type_cd_02
						and coalesce(byday_g.prod_cd, '') = coalesce(slip_g.prod_cd, '')
						and coalesce(byday_g.gye_code, '') = coalesce(slip_g.gye_code, '')
						and coalesce(byday_g.mgnt_item_no, '') = coalesce(slip_g.mgnt_item_no, '')
						and coalesce(byday_g.cust_cd, '') = coalesce(slip_g.cust_cd, '')
						and coalesce(byday_g.wh_cd, '') = coalesce(slip_g.wh_cd, '')
						and coalesce(byday_g.site_cd, '') = coalesce(slip_g.site_cd, '')
						and coalesce(byday_g.pjt_cd, '') = coalesce(slip_g.pjt_cd, '')
						and byday_g.start_dt = slip_g.start_dt
				where	byday_g.com_code is null
						or slip_g.com_code is null
						or byday_g.inc_amt_qty <> slip_g.inc_amt_qty 
						or byday_g.dec_amt_qty <> slip_g.dec_amt_qty
		) byday
		left join lateral(
			/* 이전잔량 값 있는 겅우만, 증감 차이나는 멀티선분기준 본선분의 직전선분 bal_amt_qty값 가져오기 - 잔액기준월+1제외하기 */
			select  prev_byday.start_dt prev_start_dt, prev_byday.bal_amt_qty prev_amt_qty
			from bizz.bd_sum_unity_byday_s prev_byday
			where prev_byday.com_code = v_com_code and prev_byday.sum_type_cd_01 = v_sum_type_cd_01
						and byday.com_code = prev_byday.com_code
						and byday.sum_type_cd_01 = prev_byday.sum_type_cd_01
						and byday.sum_type_cd_02 = prev_byday.sum_type_cd_02
						and coalesce(byday.prod_cd, '') = coalesce(prev_byday.prod_cd, '')
						and coalesce(byday.gye_code, '') = coalesce(prev_byday.gye_code, '')
						and coalesce(byday.mgnt_item_no, '') = coalesce(prev_byday.mgnt_item_no, '')
						and coalesce(byday.cust_cd, '') = coalesce(prev_byday.cust_cd, '')
						and coalesce(byday.wh_cd, '') = coalesce(prev_byday.wh_cd, '')
						and coalesce(byday.site_cd, '') = coalesce(prev_byday.site_cd, '')
						and coalesce(byday.pjt_cd, '') = coalesce(prev_byday.pjt_cd, '')
						and prev_byday.segl_rev_tgt_tf = false 		/* 본선분일경우 */
						and byday.min_segl_rev_tgt_tf is false 		/* 멀티선분만 있는경우는 제외 */
						and byday.start_dt > prev_byday.start_dt
						order by prev_byday.start_dt desc
						limit 1
		)prev_byday
		on true;
			
		/*
		###############################################################################################################################
		102 계정별 집계만 하는 로직 (회계)
		###############################################################################################################################
		*/
		/* 회계 계정별거래처별기준으로 변경 */
		if (v_sum_type_cd_01 = 'ACC_CUST') then 
			v_sum_type_cd_01 = 'ACC_AC';
		end if;
		
		if (v_sum_type_cd_01 = 'ACC_AC' and v_item_type is null) then /* 계정조건없을때만 실행 */
		
			with byday_g 
			as (
					/* 간소화집계를 포함한 일집계 데이터 수집 */
					select  /*+ HashJoin(byday_g slip_g) */ 
						byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd, byday.start_dt
							, sum(inc_amt_qty) inc_amt_qty, sum(dec_amt_qty) dec_amt_qty
							/* max_end_dt는 기수여부에 따라서 저장 */
							,max(case 	when (gye_type not in ('AS','DE','CP') or byday.gye_code = v_bf_gye_cd) and byday.end_dt > coalesce(to_char(to_date(ph.date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
										then '19000101'::char(8) 
									else byday.end_dt
							 end) as max_end_dt
							, sum(prev_amt_qty) prev_amt_qty /* 이전잔량 저장 */	
							, min(segl_rev_tgt_tf::int)::boolean min_segl_rev_tgt_tf /* 본선분여부 */
					from bizz.bd_sum_unity_byday_s byday
					/* update 여부 판단하기 위해서 조인 */
					left join base.acc002 a2
						on a2.com_code = v_com_code and a2.com_code = byday.com_code and a2.gye_code = byday.gye_code
					left join base.acc001_phase ph
						on ph.com_code = v_com_code and ph.com_code = byday.com_code and left(byday.start_dt,6) between ph.date_f and ph.date_t 
					where byday.com_code = v_com_code and sum_type_cd_01 = v_sum_type_cd_acc_01 and byday.start_dt like v_month||'%'
					group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd, byday.start_dt
							, case when a2.gye_code is null then byday.end_dt else '' end
			),
			slip_g 
			as (
					/* 102 집계 (계정별) */
					select slip.com_code, v_sum_type_cd_acc_01 sum_type_cd_01, slip.add_sum_item_type sum_type_cd_02
							, null prod_cd, slip.gye_code gye_code, null mgnt_item_no, null cust_cd, null wh_cd, slip.site site_cd, slip.pjt_cd pjt_cd, slip.slip_dt start_dt
							, sum(inc_amt)::numeric(28,10) inc_amt_qty, sum(dec_amt)::numeric(28,10) dec_amt_qty
					from (	
							/* 전표 데이터 수집 */
							select 	slip.com_code
							, case	when cm.copy_sno = 2	then
										case a2.gye_type 
											when 'PL' then (select gye_code from base.acc002 a2 where com_code = v_com_code and input_gubun = 'P')
											when 'CA' then (select gye_code from base.acc002 a2 where com_code = v_com_code and input_gubun = 'A')
											when 'CB' then (select gye_code from base.acc002 a2 where com_code = v_com_code and input_gubun = 'B')
											when 'CC' then (select gye_code from base.acc002 a2 where com_code = v_com_code and input_gubun = 'C')
											else slip.gye_code
										end
									else slip.gye_code
								end as gye_code
							, case when v_by_sum_tf_02 = 'Y' then slip.pjt_cd else '00' end as pjt_cd
							, case when v_by_sum_tf_01 = 'Y' then slip.site else '00' end  as site
							, slip.slip_dt
							, 'W' as add_sum_item_type
							/*
							자동대체계정 상계에 대한 추가 로직
							원가1/2/3 --> 원가1(5018)/원가2(6018)/원가3(7018)계정으로 차변
							손익 --> 대체(당기순이익)계정으로 대변에 저장
							*/
							, case  when a2.gye_type in ( 'CA','CB','CC' ) and cm.copy_sno = 2 then sum(case when slip.drcr_type = 'D' then coalesce(slip.amt, 0) else (-1)*coalesce(slip.amt, 0) end)
									when a2.gye_type in ( 'PL' ) and cm.copy_sno = 2 then 0
									else sum(case when slip.drcr_type = 'D' then coalesce(slip.amt, 0) else 0 end)
									end as inc_amt /* 차변 */
							, case  when a2.gye_type in ( 'PL' ) and cm.copy_sno = 2 then sum(case when slip.drcr_type = 'C' then coalesce(slip.amt, 0) else (-1)*coalesce(slip.amt, 0) end)
									when a2.gye_type in ( 'CA','CB','CC' ) and cm.copy_sno = 2 then 0
									else sum(case when slip.drcr_type = 'C' then coalesce(slip.amt, 0) else 0 end)
									end as dec_amt /* 대변 */	
							from bizz.bd_acc_journl_m as slip
							inner join base.acc002 a2
								on  a2.com_code = v_com_code 
								and slip.com_code = a2.com_code 
								and slip.gye_code = a2.gye_code
								and a2.input_gubun in ('Y','P','A','B','C') 	
							left outer join base.cm_copy_m as cm
								on cm.copy_sno <= 2
								and a2.gye_type in (select case when auto_sbt_tpcd = 2 then 'CA'
														when auto_sbt_tpcd = 3 then 'CB'
														when auto_sbt_tpcd = 4 then 'CC'
														when auto_sbt_tpcd = 5 then 'PL'
														else null end
													from base.acac_auto_sbt_set
													where com_code = v_com_code and auto_sbt_tpcd in (2,3,4,5))  /*대체계정 없을 수 있음으로 로직추가*/
								and a2.input_gubun = 'Y'
							where slip.com_code = v_com_code 
								and slip.slip_dt like v_month||'%'
								and slip.status_type = 'U'
								and slip.gb_type = 'Y'
								and slip.acc_slip_type in ('A','C')
							group by slip.com_code, cm.copy_sno, slip.gye_code, slip.pjt_cd, slip.site, slip.slip_dt, a2.gye_type
					) slip
					where v_sum_type_cd_01 = v_sum_type_cd_acc_01
					group by slip.com_code, slip.gye_code, slip.pjt_cd, slip.site, slip.slip_dt, slip.add_sum_item_type
					having sum(inc_amt) <> 0 or sum(dec_amt) <> 0 
			),
			target 
			as (
					select 	byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
						, byday.start_dt
						/* 이월되지 않는 계정들은 해당기수 말일로 종료일 고정. 나머지 계정들(이월O) 99991231 */
						,case 	when gye_type not in ('AS','DE','CP') or byday.gye_code = v_bf_gye_cd then coalesce(to_char(to_date(ph.date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
								else '99991231'::char(8) 
						 end  as end_dt
						/* 	1) 직전선분 prev_start_dt 잔액기준월+1이전이거나 직전선분 prev_amt_qty null인 경우 0 - 증분집계에서 반영한 데이터는 기본적으로 간소화집계
							그외) prev값 비교	*/
						, case 	when v_bal_stand_next_dt::char(8) > prev_byday.prev_start_dt or prev_byday.prev_amt_qty is null 
									then 0::numeric(28,10)
								else coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) /* 멀티선분을 포함한 시작일자의 이전잔액이 직전선분(본선분만)의 잔량과 다르면 차액 추가 */
							end prev_amt_qty			
						, slip_inc_amt - byday_inc_amt inc_amt_qty, slip_dec_amt - byday_dec_amt dec_amt_qty
						/* 	1) 직전선분이 잔액기준월+1보다 작거나 없는 경우, 차변성격인 경우 - 증감에 대한 잔량계산
							2) 직전선분이 잔액기준월+1보다 작거나 없는 경우, 대변성격인 경우 - 증감에 대한 잔량계산*-1
							3) 대변성격인 경우 - 이전잔량차이 + 증감에 대한 잔량계산*-1
							그외) - 이전잔량차이 + 증감에 대한 잔량계산	*/ 
						, case 	when (v_bal_stand_next_dt::char(8) > prev_byday.prev_start_dt or prev_byday.prev_amt_qty is null) and a2.cr_dr = 'DR' 
										then (slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt)
								when (v_bal_stand_next_dt::char(8) > prev_byday.prev_start_dt or prev_byday.prev_amt_qty is null) and a2.cr_dr = 'CR'
										then ((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))*(-1)
								when a2.cr_dr = 'CR' 
										then coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) + (((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))*(-1))
								else coalesce(prev_byday.prev_amt_qty, 0) - coalesce(byday.prev_amt_qty, 0) + ((slip_inc_amt - byday_inc_amt) - (slip_dec_amt - byday_dec_amt))
							end bal_amt_qty
						/* 원가/손익계정일때  */
						, case when max_end_dt is null 
							or max_end_dt <> (
								case	when gye_type not in ('AS','DE','CP') or byday.gye_code = v_bf_gye_cd then coalesce(to_char(to_date(ph.date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
										else '99991231'::char(8) 
								end) then 'I' else 'U' end status_type 
						, max_end_dt, ph.date_t, a2.cr_dr /*회계일때 필요*/
					from (
							/* tgt일자에 해당하는 일집계/전표 데이터 비교 */
							select
									coalesce(slip_g.com_code, byday_g.com_code) com_code
								, 	coalesce(slip_g.sum_type_cd_01, byday_g.sum_type_cd_01) sum_type_cd_01
								, 	coalesce(slip_g.sum_type_cd_02, byday_g.sum_type_cd_02) sum_type_cd_02
								, 	coalesce(slip_g.prod_cd, byday_g.prod_cd) prod_cd
								, 	coalesce(slip_g.gye_code, byday_g.gye_code) gye_code
								, 	coalesce(slip_g.mgnt_item_no, byday_g.mgnt_item_no) mgnt_item_no
								, 	coalesce(slip_g.cust_cd, byday_g.cust_cd) cust_cd
								, 	coalesce(slip_g.wh_cd, byday_g.wh_cd) wh_cd
								, 	coalesce(slip_g.site_cd, byday_g.site_cd) site_cd
								, 	coalesce(slip_g.pjt_cd, byday_g.pjt_cd) pjt_cd
								, 	coalesce(slip_g.start_dt, byday_g.start_dt) start_dt
								,	coalesce(byday_g.inc_amt_qty, 0) byday_inc_amt, coalesce(byday_g.dec_amt_qty, 0) byday_dec_amt
								, 	coalesce(slip_g.inc_amt_qty, 0) slip_inc_amt, coalesce(slip_g.dec_amt_qty, 0) slip_dec_amt
								,	byday_g.max_end_dt
								,	byday_g.prev_amt_qty	/* 이전잔량 저장 */
								,	byday_g.min_segl_rev_tgt_tf	
							from byday_g
							full outer join slip_g
							on byday_g.com_code = slip_g.com_code
									and byday_g.sum_type_cd_01 = slip_g.sum_type_cd_01
									and byday_g.sum_type_cd_02 = slip_g.sum_type_cd_02
									and coalesce(byday_g.prod_cd, '') = coalesce(slip_g.prod_cd, '')
									and coalesce(byday_g.gye_code, '') = coalesce(slip_g.gye_code, '')
									and coalesce(byday_g.mgnt_item_no, '') = coalesce(slip_g.mgnt_item_no, '')
									and coalesce(byday_g.cust_cd, '') = coalesce(slip_g.cust_cd, '')
									and coalesce(byday_g.wh_cd, '') = coalesce(slip_g.wh_cd, '')
									and coalesce(byday_g.site_cd, '') = coalesce(slip_g.site_cd, '')
									and coalesce(byday_g.pjt_cd, '') = coalesce(slip_g.pjt_cd, '')
									and byday_g.start_dt = slip_g.start_dt
							where	byday_g.com_code is null
									or slip_g.com_code is null
									or byday_g.inc_amt_qty <> slip_g.inc_amt_qty 
									or byday_g.dec_amt_qty <> slip_g.dec_amt_qty
					) byday
					/* 회계 계정별 집계에서만 추가 */
					left join base.acc002 a2
						on a2.com_code = v_com_code and a2.com_code = byday.com_code and a2.gye_code = byday.gye_code
					left join base.acc001_phase ph
						on ph.com_code = v_com_code and ph.com_code = byday.com_code and left(byday.start_dt,6) between ph.date_f and ph.date_t 
					left join lateral(
						/* 이전잔량 값 있는 겅우만, 증감 차이나는 멀티선분기준 본선분의 직전선분 bal_amt_qty값 가져오기 - 잔액기준월+1제외하기 */
						select  prev_byday.start_dt prev_start_dt, prev_byday.bal_amt_qty prev_amt_qty
						from bizz.bd_sum_unity_byday_s prev_byday
						where prev_byday.com_code = v_com_code and prev_byday.sum_type_cd_01 = v_sum_type_cd_01
									and byday.com_code = prev_byday.com_code
									and byday.sum_type_cd_01 = prev_byday.sum_type_cd_01
									and byday.sum_type_cd_02 = prev_byday.sum_type_cd_02
									and coalesce(byday.prod_cd, '') = coalesce(prev_byday.prod_cd, '')
									and coalesce(byday.gye_code, '') = coalesce(prev_byday.gye_code, '')
									and coalesce(byday.mgnt_item_no, '') = coalesce(prev_byday.mgnt_item_no, '')
									and coalesce(byday.cust_cd, '') = coalesce(prev_byday.cust_cd, '')
									and coalesce(byday.wh_cd, '') = coalesce(prev_byday.wh_cd, '')
									and coalesce(byday.site_cd, '') = coalesce(prev_byday.site_cd, '')
									and coalesce(byday.pjt_cd, '') = coalesce(prev_byday.pjt_cd, '')
									and prev_byday.segl_rev_tgt_tf = false 		/* 본선분일경우 */
									and byday.min_segl_rev_tgt_tf is false 		/* 멀티선분만 있는경우는 제외 */
									and byday.start_dt > prev_byday.start_dt
									/*  회계 계정별집계만일때 기수별로 집계하는 경우는 기수범위 넘어가면 제외 */
									and case when a2.gye_type not in ('AS','DE','CP') or byday.gye_code in (v_bf_gye_cd,v_af_gye_cd)
											then ph.date_f <= left(prev_byday.start_dt,6)
										else true end
									and a2.gye_code is not null					/* 계정 조인 안되는경우 제외 */
									order by prev_byday.start_dt desc
									limit 1
					)prev_byday
					on true
			)
			insert	into tmp_upsert_n
				select com_code, sum_type_cd_01, sum_type_cd_02, prod_cd, gye_code, mgnt_item_no
					, cust_cd, wh_cd, site_cd, pjt_cd
					, start_dt, end_dt
					, sum(prev_amt_qty) prev_amt_qty, sum(inc_amt_qty) inc_amt_qty, sum(dec_amt_qty) dec_amt_qty, sum(bal_amt_qty) bal_amt_qty, status_type
				from (
					select target_carr.com_code, target_carr.sum_type_cd_01, target_carr.sum_type_cd_02, target_carr.prod_cd, target_carr.gye_code, target_carr.mgnt_item_no
						, target_carr.cust_cd, target_carr.wh_cd, target_carr.site_cd, target_carr.pjt_cd
						, target_carr.start_dt, target_carr.end_dt
						/* 계정 데이터삭제했을 경우 모두 0원으로 변경 */
						, case when cr_dr is null then 0 else target_carr.prev_amt_qty end prev_amt_qty
						, case when cr_dr is null then 0 else target_carr.inc_amt_qty end inc_amt_qty
						, case when cr_dr is null then 0 else target_carr.dec_amt_qty end dec_amt_qty
						, case when cr_dr is null then 0 else target_carr.bal_amt_qty end bal_amt_qty
						, case when cr_dr is null then 'X' else target_carr.status_type end status_type
					from target target_carr
					/* 변화되는 부분이 없는 경우 - prev가 다른경우 선분 끊어줌 (회계 전기손익대체 or 잔액기준월+1인 경우) */
					where target_carr.inc_amt_qty <> 0 or target_carr.dec_amt_qty <> 0
					
					union all
					
					/* 회계 계정별집계만 전기손익대체 BF계정의 증가분을 다음기수 1일의 이월잔액/잔액으로 이월시킴 */
					select  target_carr.com_code, target_carr.sum_type_cd_01, target_carr.sum_type_cd_02, target_carr.prod_cd, v_af_gye_cd as gye_code, target_carr.mgnt_item_no
						, target_carr.cust_cd, target_carr.wh_cd, target_carr.site_cd, target_carr.pjt_cd
						, to_char(to_date(date_t,'YYYYMM') + interval '1 month','YYYYMMDD')::char(8)  start_dt, '99991231'::char(8)  end_dt
						/* 증가분만 가져옴, 그외 prev에서 차이나는 부분은 후에 기수변경에서 추가됨 */
						, case when cr_dr = 'DR' then target_carr.inc_amt_qty-target_carr.dec_amt_qty else (target_carr.inc_amt_qty-target_carr.dec_amt_qty)*(-1) end prev_amt_qty
						, 0 inc_amt_qty, 0 dec_amt_qty
						, case when cr_dr = 'DR' then target_carr.inc_amt_qty-target_carr.dec_amt_qty else (target_carr.inc_amt_qty-target_carr.dec_amt_qty)*(-1) end bal_amt_qty
						, case when 0 < (select count(*) cnt
								from bizz.bd_sum_unity_byday_s byday
								where byday.com_code = v_com_code 
								and target_carr.sum_type_cd_01 = byday.sum_type_cd_01
								and target_carr.sum_type_cd_02 = byday.sum_type_cd_02
								and coalesce(target_carr.prod_cd, '') = coalesce(byday.prod_cd, '')
								and v_af_gye_cd = coalesce(byday.gye_code, '')
								and coalesce(target_carr.mgnt_item_no, '') = coalesce(byday.mgnt_item_no, '')
								and coalesce(target_carr.cust_cd, '') = coalesce(byday.cust_cd, '')
								and coalesce(target_carr.wh_cd, '') = coalesce(byday.wh_cd, '')
								and coalesce(target_carr.site_cd, '') = coalesce(byday.site_cd, '')
								and coalesce(target_carr.pjt_cd, '') = coalesce(byday.pjt_cd, '')
								and to_char(to_date(date_t,'YYYYMM') + interval '1 month','YYYYMMDD')::char(8) = byday.start_dt
								and '99991231'::char(8)  = byday.end_dt 
								) then 'U' else 'I' end status_type
					from target target_carr
					where target_carr.gye_code = v_bf_gye_cd
						and sum_type_cd_01 = v_sum_type_cd_acc_01
						and (inc_amt_qty <> 0 or dec_amt_qty <> 0)
				) target_carr
				group by target_carr.com_code, target_carr.sum_type_cd_01, target_carr.sum_type_cd_02, target_carr.prod_cd, target_carr.gye_code, target_carr.mgnt_item_no
						, target_carr.cust_cd, target_carr.wh_cd, target_carr.site_cd, target_carr.pjt_cd
						, target_carr.start_dt, target_carr.end_dt, target_carr.status_type
			;
			
		end if;
				
		insert into bizz.bd_sum_unity_byday_s
				( com_code, sum_type_cd_01, sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty, segl_rev_tgt_tf )
		select com_code, sum_type_cd_01, sum_type_cd_02
				, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt
				, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty, true segl_rev_tgt_tf
		from tmp_upsert_n
		where status_type = 'I';
		
		update 	/*+ HashJoin(tgt byday) Leading (byday tgt) */
				bizz.bd_sum_unity_byday_s byday
		set		prev_amt_qty = byday.prev_amt_qty + tmp.prev_amt_qty
			,	inc_amt_qty = byday.inc_amt_qty + tmp.inc_amt_qty
			,	dec_amt_qty	= byday.dec_amt_qty + tmp.dec_amt_qty 
			,	bal_amt_qty	= byday.bal_amt_qty + tmp.bal_amt_qty
		from (
				select com_code,sum_type_cd_01,sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty
				from tmp_upsert_n tgt
				where status_type = 'U' 
					and not(tgt.gye_code = v_af_gye_cd and sum_type_cd_01 = v_sum_type_cd_acc_01) -- 계정별집계&af계정이 아닌경우
		) tmp
		where	byday.com_code = v_com_code and byday.sum_type_cd_01 = tmp.sum_type_cd_01 and byday.sum_type_cd_02 = tmp.sum_type_cd_02
				and byday.start_dt like v_month||'%'
				and byday.com_code = tmp.com_code 
				and coalesce(byday.prod_cd, '') = coalesce(tmp.prod_cd, '')
				and coalesce(byday.gye_code, '') = coalesce(tmp.gye_code, '')
				and coalesce(byday.mgnt_item_no, '') = coalesce(tmp.mgnt_item_no, '')
				and coalesce(byday.cust_cd, '') = coalesce(tmp.cust_cd, '')
				and coalesce(byday.wh_cd, '') = coalesce(tmp.wh_cd, '')
				and coalesce(byday.site_cd, '') = coalesce(tmp.site_cd, '')
				and coalesce(byday.pjt_cd, '') = coalesce(tmp.pjt_cd, '')
				and byday.start_dt = tmp.start_dt
				and byday.end_dt||'' = tmp.end_dt
		;
		
		/* 계정별집계에서 계정이 삭제된 경우 */
		update 	/*+ NestLoop(tgt byday) Leading (tgt byday) */
				bizz.bd_sum_unity_byday_s byday
		set		prev_amt_qty = tmp.prev_amt_qty
			,	inc_amt_qty = tmp.inc_amt_qty
			,	dec_amt_qty	= tmp.dec_amt_qty 
			,	bal_amt_qty	= tmp.bal_amt_qty
			,	segl_rev_tgt_tf = true
		from (
				select com_code,sum_type_cd_01,sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty
				from tmp_upsert_n tgt
				where status_type = 'X' 
		) tmp
		where	byday.com_code = v_com_code and byday.sum_type_cd_01 = tmp.sum_type_cd_01 and byday.sum_type_cd_02 = tmp.sum_type_cd_02
				and byday.com_code = tmp.com_code 
				and coalesce(byday.prod_cd, '') = coalesce(tmp.prod_cd, '')
				and coalesce(byday.gye_code, '') = coalesce(tmp.gye_code, '')
				and coalesce(byday.mgnt_item_no, '') = coalesce(tmp.mgnt_item_no, '')
				and coalesce(byday.cust_cd, '') = coalesce(tmp.cust_cd, '')
				and coalesce(byday.wh_cd, '') = coalesce(tmp.wh_cd, '')
				and coalesce(byday.site_cd, '') = coalesce(tmp.site_cd, '')
				and coalesce(byday.pjt_cd, '') = coalesce(tmp.pjt_cd, '')
				and byday.start_dt = tmp.start_dt
		;
		
		/* 회계계정별집계일 경우 월별계정별에서 전기손익대체만 prev_amt_qyt 추가 변경 필요 */
		if (v_sum_type_cd_01 = 'ACC_AC' 
				and exists(select count(*) from tmp_upsert_n tgt where tgt.status_type = 'U' and tgt.gye_code = v_af_gye_cd)
				and  v_item_type is null ) then 
			update 
					bizz.bd_sum_unity_byday_s byday
			set		prev_amt_qty = byday.prev_amt_qty + tmp.prev_amt_qty
				,	inc_amt_qty = byday.inc_amt_qty + tmp.inc_amt_qty
				,	dec_amt_qty	= byday.dec_amt_qty + tmp.dec_amt_qty 
				,	bal_amt_qty	= byday.bal_amt_qty + tmp.bal_amt_qty
			from (
					select com_code,sum_type_cd_01,sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty
					from tmp_upsert_n tgt
					where tgt.status_type = 'U' and tgt.gye_code = v_af_gye_cd and sum_type_cd_01 = v_sum_type_cd_acc_01
			) tmp
			where	byday.com_code = v_com_code and byday.sum_type_cd_01 = tmp.sum_type_cd_01 and byday.sum_type_cd_02 = tmp.sum_type_cd_02
					and byday.com_code = tmp.com_code 
					and coalesce(byday.prod_cd, '') = coalesce(tmp.prod_cd, '')
					and coalesce(byday.gye_code, '') = coalesce(tmp.gye_code, '')
					and coalesce(byday.mgnt_item_no, '') = coalesce(tmp.mgnt_item_no, '')
					and coalesce(byday.cust_cd, '') = coalesce(tmp.cust_cd, '')
					and coalesce(byday.wh_cd, '') = coalesce(tmp.wh_cd, '')
					and coalesce(byday.site_cd, '') = coalesce(tmp.site_cd, '')
					and coalesce(byday.pjt_cd, '') = coalesce(tmp.pjt_cd, '')
					and byday.start_dt = tmp.start_dt
					and byday.end_dt||'' = tmp.end_dt
			;
		end if;
		
		delete from tmp_upsert_n;
		
		
		/* ## 관리자계정일때 이전잔량 직전선분잔량과 비교하기  ########################################### */
		if exists(select id from base.password where com_code = '00000' and id = v_user_sid limit 1) 
		then 	
		
			/* ## 공통로직  ########################################### */
			with byday_g 
			as (
					/* 기존 집계기준 이전잔액 데이터 수집 - 공통 */
					select 
						byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
							, byday.start_dt , max(byday.end_dt) max_end_dt
							, sum(prev_amt_qty) prev_amt_qty /* 이전잔량 저장 */		
							, min(segl_rev_tgt_tf::int)::boolean min_segl_rev_tgt_tf /* 본선분여부 */
					from bizz.bd_sum_unity_byday_s byday
					where byday.com_code = v_com_code and sum_type_cd_01 = v_sum_type_cd_01 /*회계일때 ACC_AC, 그외 공통*/
					and byday.start_dt like v_month||'%'
					group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd, byday.start_dt
					
					union all
					
					/* 기존 집계기준 이전잔액 데이터 수집 - 회계일때만 */
					select 
						byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
							, byday.start_dt , max(byday.end_dt) max_end_dt
							, sum(prev_amt_qty) prev_amt_qty /* 이전잔량 저장 */		
							, min(segl_rev_tgt_tf::int)::boolean min_segl_rev_tgt_tf /* 본선분여부 */
					from bizz.bd_sum_unity_byday_s byday
					where byday.com_code = v_com_code and sum_type_cd_01 = 'ACC_CUST'  /*회계일때 ACC_CUST*/ and v_sum_type_cd_01 = 'ACC_AC'
					and byday.start_dt like v_month||'%'
					group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
							, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd, byday.start_dt
					
			)
			insert	into tmp_upsert_n
			select byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02, byday.prod_cd
				, case 	when cm.copy_sno = 2 /* 전기손익대체만 */
							then v_af_gye_cd
						else byday.gye_code end gye_code
				, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
				, case 	when cm.copy_sno = 2 /* 전기손익대체만 */
							then coalesce(to_char(to_date(date_t,'YYYYMM')+ interval'1 month' ,'YYYYMMDD'),'99991231')::char(8)  
						else byday.start_dt end start_dt
				/* 이월되지 않는 계정들은 해당기수 말일로 종료일 고정. 나머지 계정들(이월O) 99991231 */
				,case 	when cm.copy_sno = 2 /* 전기손익대체만 */
							then '99991231'::char(8)
						when byday.sum_type_cd_01 = 'ACC_AC' and (gye_type not in ('AS','DE','CP') or byday.gye_code = v_bf_gye_cd) 
							then coalesce(to_char(to_date(date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
						else '99991231'::char(8) 
				 end  as end_dt
				, byday.prev_amt_qty, 0 inc_amt_qty, 0 dec_amt_qty, byday.prev_amt_qty bal_amt_qty
				, case when (cm.copy_sno = 2) /* 전기손익대체만 */ 
							and exists(select com_code
									from bizz.bd_sum_unity_byday_s byday_sub
									where byday_sub.com_code = v_com_code 
										and byday_sub.sum_type_cd_01 = 'ACC_AC'
										and byday.sum_type_cd_01 = byday_sub.sum_type_cd_01
										and byday.sum_type_cd_02 = byday_sub.sum_type_cd_02
										and coalesce(byday.prod_cd, '') = coalesce(byday_sub.prod_cd, '')
										and v_af_gye_cd = coalesce(byday_sub.gye_code, '')
										and coalesce(byday.mgnt_item_no, '') = coalesce(byday_sub.mgnt_item_no, '')
										and coalesce(byday.cust_cd, '') = coalesce(byday_sub.cust_cd, '')
										and coalesce(byday.wh_cd, '') = coalesce(byday_sub.wh_cd, '')
										and coalesce(byday.site_cd, '') = coalesce(byday_sub.site_cd, '')
										and coalesce(byday.pjt_cd, '') = coalesce(byday_sub.pjt_cd, '')
										and to_char(to_date(date_t,'YYYYMM') + interval '1 month','YYYYMMDD')::char(8) = byday_sub.start_dt
										and '99991231'::char(8) = byday_sub.end_dt 
									) then 'U' 
					when cm.copy_sno = 2 then 'I'
					when max_end_dt is null 
						or max_end_dt <> (
							case	when byday.sum_type_cd_01 = 'ACC_AC' and (gye_type not in ('AS','DE','CP') or byday.gye_code = v_bf_gye_cd) 
										then coalesce(to_char(to_date(date_t,'YYYYMM')+ interval'1 month' - interval'1 day','YYYYMMDD'),'99991231')::char(8)  
									else '99991231'::char(8) 
							end) then 'I' else 'U' end status_type 
			from (
				select byday_g.com_code, byday_g.sum_type_cd_01, byday_g.sum_type_cd_02
					, byday_g.prod_cd, byday_g.gye_code, byday_g.mgnt_item_no, byday_g.cust_cd, byday_g.wh_cd, byday_g.site_cd, byday_g.pjt_cd
					, byday_g.start_dt , byday_g.max_end_dt
					, coalesce(prev_byday.prev_amt_qty,0) - byday_g.prev_amt_qty prev_amt_qty /* 이전잔량 차이 */	
					, a2.gye_type, ph.date_t
				from byday_g 
				left join base.acc002 a2
					on a2.com_code = v_com_code and a2.com_code = byday_g.com_code and a2.gye_code = byday_g.gye_code and byday_g.sum_type_cd_01 = 'ACC_AC' 
				left join base.acc001_phase ph
					on ph.com_code = v_com_code and ph.com_code = byday_g.com_code and v_month between ph.date_f and ph.date_t and byday_g.sum_type_cd_01 = 'ACC_AC'
				join lateral(
				/* 이전잔량 값 있는 겅우만, 본선분의 직전선분 bal_amt_qty값 가져오기 */
					select  prev_byday.start_dt prev_start_dt, prev_byday.bal_amt_qty prev_amt_qty
					from bizz.bd_sum_unity_byday_s prev_byday
					where prev_byday.com_code = v_com_code
								and byday_g.com_code = prev_byday.com_code
								and byday_g.sum_type_cd_01 = prev_byday.sum_type_cd_01
								and byday_g.sum_type_cd_02 = prev_byday.sum_type_cd_02
								and coalesce(byday_g.prod_cd, '') = coalesce(prev_byday.prod_cd, '')
								and coalesce(byday_g.gye_code, '') = coalesce(prev_byday.gye_code, '')
								and coalesce(byday_g.mgnt_item_no, '') = coalesce(prev_byday.mgnt_item_no, '')
								and coalesce(byday_g.cust_cd, '') = coalesce(prev_byday.cust_cd, '')
								and coalesce(byday_g.wh_cd, '') = coalesce(prev_byday.wh_cd, '')
								and coalesce(byday_g.site_cd, '') = coalesce(prev_byday.site_cd, '')
								and coalesce(byday_g.pjt_cd, '') = coalesce(prev_byday.pjt_cd, '')
								and prev_byday.segl_rev_tgt_tf = false 		/* 본선분일경우 */
								and byday_g.min_segl_rev_tgt_tf is false 		/* 멀티선분만 있는경우는 제외 */
								and byday_g.start_dt > prev_byday.start_dt
								/*  
									회계 계정별집계만일때 기수별로 집계하는 경우는 기수범위 넘어가면 제외
									회계 잔액기준월 이전이면 제외
								*/
								and case when byday_g.sum_type_cd_01 = 'ACC_AC' 
											and (a2.gye_type not in ('AS','DE','CP') or byday_g.gye_code in (v_bf_gye_cd,v_af_gye_cd))
										then ph.date_f <= left(prev_byday.start_dt,6)
									when byday_g.sum_type_cd_01 in ('ACC_AC','ACC_CUST')
										then v_bal_stand_dt::char(8) < prev_byday.start_dt 
									else true end
								order by prev_byday.start_dt desc
								limit 1
				)prev_byday
				on true
				where coalesce(prev_byday.prev_amt_qty,0) <> byday_g.prev_amt_qty
			
			) byday
			left join base.cm_copy_m as cm /* 전기손익대체 BF계정의 증가분을 다음기수 1일의 이월잔액/잔액으로 이월시킴 */
				on cm.copy_sno <= 2 and v_bf_gye_cd = byday.gye_code and byday.sum_type_cd_01 = 'ACC_AC' 
			;
			
			/* ## 회계 기수초의 v_af_gye_cd(3779)계정의 예외로직  ########################################### */
			if (v_sum_type_cd_01 = 'ACC_AC' 
					and  exists(select com_code from base.acc001_phase ph where ph.com_code = v_com_code and v_month = ph.date_f limit 1) 
			) then 
			
				with byday_g 
				as (
						/* 기존 집계기준 이전잔액 v_af_gye_cd */
						select 
							byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
								, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
								, max(byday.start_dt) max_start_dt, max(byday.end_dt) max_end_dt
								, sum(prev_amt_qty) prev_amt_qty /* 이전잔량 저장 */	
						from bizz.bd_sum_unity_byday_s byday
						where byday.com_code = v_com_code and sum_type_cd_01 = 'ACC_AC' and byday.gye_code = v_af_gye_cd
						and v_month||'01' between byday.start_dt and byday.end_dt
						group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
								, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
						
				),
				prev_byday_g 
				as (
						/* 이전 집계기준 잔액 v_bf_gye_cd+v_af_gye_cd */
						select 
							byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
								, byday.prod_cd, v_af_gye_cd gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
								, sum(bal_amt_qty) prev_amt_qty /* 이전잔량 저장 */		
						from bizz.bd_sum_unity_byday_s byday
						where byday.com_code = v_com_code and sum_type_cd_01 = 'ACC_AC' and byday.gye_code in (v_bf_gye_cd,v_af_gye_cd)
						and to_char(to_date(v_month,'YYYYMM') - interval '1 day', 'YYYYMMDD')::char(8) between byday.start_dt and byday.end_dt
						group by byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02
								, byday.prod_cd, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
								
				)
				insert	into tmp_upsert_n
				select byday.com_code, byday.sum_type_cd_01, byday.sum_type_cd_02, byday.prod_cd, byday.gye_code, byday.mgnt_item_no, byday.cust_cd, byday.wh_cd, byday.site_cd, byday.pjt_cd
					, v_month||'01' start_dt ,'99991231'::char(8) end_dt
					, byday.prev_amt_qty, 0 inc_amt_qty, 0 dec_amt_qty, byday.prev_amt_qty bal_amt_qty
					, case when max_start_dt = v_month||'01' and max_end_dt = '99991231'::char(8) 
								then 'U' else 'I' end status_type 
				from (
						select
								coalesce(prev_byday_g.com_code, byday_g.com_code) com_code
							, 	coalesce(prev_byday_g.sum_type_cd_01, byday_g.sum_type_cd_01) sum_type_cd_01
							, 	coalesce(prev_byday_g.sum_type_cd_02, byday_g.sum_type_cd_02) sum_type_cd_02
							, 	coalesce(prev_byday_g.prod_cd, byday_g.prod_cd) prod_cd
							, 	coalesce(prev_byday_g.gye_code, byday_g.gye_code) gye_code
							, 	coalesce(prev_byday_g.mgnt_item_no, byday_g.mgnt_item_no) mgnt_item_no
							, 	coalesce(prev_byday_g.cust_cd, byday_g.cust_cd) cust_cd
							, 	coalesce(prev_byday_g.wh_cd, byday_g.wh_cd) wh_cd
							, 	coalesce(prev_byday_g.site_cd, byday_g.site_cd) site_cd
							, 	coalesce(prev_byday_g.pjt_cd, byday_g.pjt_cd) pjt_cd
							, 	coalesce(prev_byday_g.prev_amt_qty,0) - coalesce(byday_g.prev_amt_qty,0) prev_amt_qty
							,	byday_g.max_start_dt max_start_dt
							,	byday_g.max_end_dt max_end_dt
						from prev_byday_g
						full outer join byday_g
						on byday_g.com_code = prev_byday_g.com_code
								and byday_g.sum_type_cd_01 = prev_byday_g.sum_type_cd_01
								and byday_g.sum_type_cd_02 = prev_byday_g.sum_type_cd_02
								and coalesce(byday_g.prod_cd, '') = coalesce(prev_byday_g.prod_cd, '')
								and coalesce(byday_g.gye_code, '') = coalesce(prev_byday_g.gye_code, '')
								and coalesce(byday_g.mgnt_item_no, '') = coalesce(prev_byday_g.mgnt_item_no, '')
								and coalesce(byday_g.cust_cd, '') = coalesce(prev_byday_g.cust_cd, '')
								and coalesce(byday_g.wh_cd, '') = coalesce(prev_byday_g.wh_cd, '')
								and coalesce(byday_g.site_cd, '') = coalesce(prev_byday_g.site_cd, '')
								and coalesce(byday_g.pjt_cd, '') = coalesce(prev_byday_g.pjt_cd, '')
						where	coalesce(byday_g.prev_amt_qty,0) <> coalesce(prev_byday_g.prev_amt_qty,0) 
				) byday 
				;
				
			end if;
				
				
			/* insert update 따로 하기 */					
			insert into bizz.bd_sum_unity_byday_s
					( com_code, sum_type_cd_01, sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty, segl_rev_tgt_tf )
			select com_code, sum_type_cd_01, sum_type_cd_02
					, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt
					, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty, true segl_rev_tgt_tf
			from tmp_upsert_n
			where status_type = 'I';
			
			update 	/*+  NestLoop(tgt byday) Leading(tgt byday) IndexScan(byday uk_bd_sum_unity_byday_s_02) */
					bizz.bd_sum_unity_byday_s byday
			set		prev_amt_qty = byday.prev_amt_qty + tmp.prev_amt_qty
				,	bal_amt_qty	= byday.bal_amt_qty + tmp.bal_amt_qty
			from (
					select com_code,sum_type_cd_01,sum_type_cd_02, prod_cd, gye_code, mgnt_item_no, cust_cd, wh_cd, site_cd, pjt_cd, start_dt, end_dt, prev_amt_qty, inc_amt_qty, dec_amt_qty, bal_amt_qty
					from tmp_upsert_n tgt
					where status_type = 'U'
			) tmp
			where	byday.com_code = v_com_code and byday.sum_type_cd_01 = tmp.sum_type_cd_01 and byday.sum_type_cd_02 = tmp.sum_type_cd_02
					and byday.com_code = tmp.com_code 
					and coalesce(byday.prod_cd, '') = coalesce(tmp.prod_cd, '')
					and coalesce(byday.gye_code, '') = coalesce(tmp.gye_code, '')
					and coalesce(byday.mgnt_item_no, '') = coalesce(tmp.mgnt_item_no, '')
					and coalesce(byday.cust_cd, '') = coalesce(tmp.cust_cd, '')
					and coalesce(byday.wh_cd, '') = coalesce(tmp.wh_cd, '')
					and coalesce(byday.site_cd, '') = coalesce(tmp.site_cd, '')
					and coalesce(byday.pjt_cd, '') = coalesce(tmp.pjt_cd, '')
					and byday.start_dt = tmp.start_dt
					and byday.end_dt||'' = tmp.end_dt
			;
			
		end if;		
		
		/* ## 집계이력 저장  ########################################### */
		
		if (v_sum_type_cd_01 = 'ACC_AC') then 
			v_sum_type_cd_01 := 'ACC';
		end if;
		
		/* INV_FC_D: 재고강제일집계 */
		if v_item_type is not null and v_sum_type_cd_01 = 'ACC' then /* 조건있는경우 : 회계-계정*/
			
			select string_agg(add_cd_01,',') into v_item_list 
			from bizz.tm_bas_cd_i 
			where refer_sid = v_refer_sid and item_type = 'GYE' and com_code = v_com_code;
			
			insert into bizz.hi_sum_h ( hist_sid, hist_type_cd, com_code, hist_ctt, wrtr_id, wrt_dtm, modr_id, mod_dtm)
			values ( bizz.fn_get_sid(), v_sum_type_cd_01||'_FC', v_com_code, v_month||' 일선분 강제집계 - 거래처별 집계 계정조건('||v_item_list||')', v_user_sid, v_sum_start_time, v_user_sid, clock_timestamp() );
		
		else /* 공통 */
		
			insert into bizz.hi_sum_h ( hist_sid, hist_type_cd, com_code, hist_ctt, wrtr_id, wrt_dtm, modr_id, mod_dtm)
			values ( bizz.fn_get_sid(), v_sum_type_cd_01||'_FC', v_com_code, v_month||' 일선분 강제집계', v_user_sid, v_sum_start_time, v_user_sid, clock_timestamp() );
		
		end if;
		
		if (v_sum_type_cd_01 = 'ACC_FXASET') then 
		
			/* ## 2) 집계대상일자 테이블 정보갱신 ############################## */
			update bizz.bd_acc_amt_sum_tgt_dt_i
			set sum_status_type = 'C'
				,	write_dtm = clock_timestamp()
			where com_code = v_com_code and tgt_dv_cd = 'F' and sum_status_type = 'P'
				and slip_dt like v_month||'%';
			
			get diagnostics v_update_rows := row_count;
			/* update 된 대상이 없다면 신규 데이터 insert. 멀티선분 생성시점 찾기 위함 */
			if v_update_rows = 0 then
					insert into bizz.bd_acc_amt_sum_tgt_dt_i (com_code, sum_tgt_sid, slip_dt, sum_tgt_type, sum_status_type, tgt_dv_cd ,write_dtm)
					values ( v_com_code, bizz.fn_get_sid(), v_month||'01', 'D', 'C', 'F', clock_timestamp() );
			end if;
			
		elseif (v_sum_type_cd_01 in ('INV','ACC','ACC_RECEIVABLE','ACC_PAYABLE') ) then /*회계 계정코드 검색조건 있어도 추가*/
			
			/* ## 2) 집계대상일자 테이블 정보갱신 ############################## */
			update bizz.bd_sum_unity_tgt_dt_i 
			set 	sum_status_type = 'C'
				,	update_dtm = clock_timestamp()
				,	update_sid = v_user_sid
			where com_code = v_com_code and slip_dt like v_month||'%' and bizz_sid = v_bizz_sid and sum_status_type = 'P';
			
			get diagnostics v_update_rows := row_count;
			/* update 된 대상이 없다면 신규 데이터 insert. 멀티선분 생성시점 찾기 위함 */
			if v_update_rows = 0 then
				insert into bizz.bd_sum_unity_tgt_dt_i ( com_code, sum_tgt_sid, bizz_sid, slip_dt, sum_tgt_type, sum_status_type, write_dtm, write_sid, update_dtm, update_sid )
				values ( v_com_code, bizz.fn_get_sid(), v_bizz_sid,  v_month||'01', 'D', 'C', clock_timestamp(), 'ECOUNT', clock_timestamp(), 'ECOUNT');					
			end if;
			
		end if;
	
end

$BODY$;
    `;

export const migQueryMs = `
USE ACCT;

/****************************************************************************
REMARKS : dev 92634 A24_01616 아이패드 앱에서 로그인시 흰화면으로 나오는 현상 (전존)
NAME : 양미진
DATE : 2024.03.25

[MYPAGE_URL 이 공란이고 SER_NO와 MENU_SEQ 같은 데이터 VER_NO 업데이트]
HERA AWS
AA존 - 2122개
AB존 - 2168개
AC존 - 2681개
BA존 - 2529개
BB존 - 1703개
BC존 - 891개
CA존 - 2535개
CB존 - 2724개
CC존 - 2020개
CD존 - 2343개
F존 - 58개
IA존 - 560개
****************************************************************************/


/* 1. RESOTRE QUERY
!!!RESTORE_START

USE ACCT;

DECLARE @ROWCNT INT = 0

UPDATE A
SET A.VER_NO = B.VER_NO
FROM COMO_APPMENU_VERSION A
INNER JOIN COMO_APPMENU_VERSION_20240325_YMJ_054_ECBACK B
	ON A.COM_CODE = B.COM_CODE AND A.USER_ID = B.USER_ID
--MAXDOP

-- LOG
SET @ROWCNT = @@ROWCOUNT;
EXEC ACCT.DBO.ESP_MIGLOG_INSERT @DEV_ID =\'\${DEVID}\', @JOB_CODE = \'\${JOBCD}\', @FILE_NM = \'\${FILENM}\', @REMARKS ='RESOTRE COMO_APPMENU_VERSION', @TYPEVALUE ='R', @RCNT= @ROWCNT;

!!!RESTORE_END
*/

/* 2. BACKUP QUERY : */

DECLARE @ROWCNT INT = 0

IF OBJECT_ID('ACCT.DBO.COMO_MAINMENU_ITEM_20240325_YMJ_054_ECBACK') IS NOT NULL
	DROP TABLE COMO_MAINMENU_ITEM_20240325_YMJ_054_ECBACK

SELECT A.*
INTO COMO_MAINMENU_ITEM_20240325_YMJ_054_ECBACK
FROM COMO_MAINMENU_ITEM AS A WITH(NOLOCK)
WHERE A.MYPAGE_URL = '' AND A.SER_NO IN (2137, 2138, 2139, 2140, 2141, 2142, 2143, 2144, 2145, 2146, 2147, 2148, 2149, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158, 2159, 2160, 2161, 2162, 2163, 2164, 2165, 2166, 2167, 2168, 2169, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2177, 2178, 2179, 2180, 2181, 2182, 2183, 2184, 2185, 2186, 2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059, 2060, 2061, 2062, 2063, 2064, 2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2074, 2075, 2076, 2077, 2078, 2079, 2080, 2081, 2082, 2083, 2084, 2085, 2599, 2600, 2601, 2602, 2603, 2604, 2605, 2606, 2607, 2608, 2609, 2610, 2611, 2612, 2613, 2614, 2615, 2616, 2617, 2618, 2619, 2620, 2621, 2622, 2623, 2624, 2625, 2626, 2627, 2628, 2629, 2630, 2631, 2632, 2633, 2634, 2635, 2636, 2637, 2638, 2639, 2640, 2641, 2642, 2643, 2644, 2645, 2646, 2647, 2648, 2238, 2239, 2240, 2241, 2242, 2243, 2244, 2245, 2246, 2247, 2248, 2249, 2250, 2251, 2252, 2253, 2254, 2255, 2256, 2257, 2258, 2259, 2260, 2261, 2262, 2263, 2264, 2265, 2266, 2267, 2268, 2269, 2270, 2271, 2272, 2273, 2274, 2275, 2276, 2277, 2278, 2279, 2280, 2281, 2282, 2283, 2284, 2285, 2286, 2287)
--MAXDOP	

-- LOG
SET @ROWCNT = @@ROWCOUNT;
EXEC ACCT.DBO.ESP_MIGLOG_INSERT @DEV_ID =\'\${DEVID}\', @JOB_CODE = \'\${JOBCD}\', @FILE_NM = \'\${FILENM}\', @REMARKS ='BACKUP COMO_MAINMENU_ITEM', @TYPEVALUE ='B', @RCNT= @ROWCNT;

IF OBJECT_ID('ACCT.DBO.COMO_APPMENU_VERSION_20240325_YMJ_054_ECBACK') IS NOT NULL
	DROP TABLE COMO_APPMENU_VERSION_20240325_YMJ_054_ECBACK

SELECT T.*, T.VER_NO + 1 AS NEW_VER_NO
INTO COMO_APPMENU_VERSION_20240325_YMJ_054_ECBACK
FROM
(
	SELECT A.*
	FROM COMO_APPMENU_VERSION AS A WITH(NOLOCK)
	JOIN COMO_MAINMENU_ITEM_20240325_YMJ_054_ECBACK AS B WITH(NOLOCK)
	ON A.COM_CODE = B.COM_CODE AND A.USER_ID = B.USER_ID
) T
GROUP BY T.COM_CODE, T.USER_ID, T.VER_NO, T.WRITER_ID, T.WRITE_DT, T.EDITOR_ID, T.EDIT_DT, T.MENU_ADD_VER_NO, T.FS_OWNER_KEY, T.ATT_FILE_INFO_CTT
--MAXDOP	

-- LOG
SET @ROWCNT = @@ROWCOUNT;
EXEC ACCT.DBO.ESP_MIGLOG_INSERT @DEV_ID =\'\${DEVID}\', @JOB_CODE = \'\${JOBCD}\', @FILE_NM = \'\${FILENM}\', @REMARKS ='BACKUP COMO_APPMENU_VERSION', @TYPEVALUE ='B', @RCNT= @ROWCNT;
/* 3. EXECUTE QUERY */

UPDATE A
SET A.VER_NO = B.NEW_VER_NO
FROM COMO_APPMENU_VERSION A
INNER JOIN COMO_APPMENU_VERSION_20240325_YMJ_054_ECBACK B
	ON A.COM_CODE = B.COM_CODE AND A.USER_ID = B.USER_ID
--MAXDOP

-- LOG
SET @ROWCNT = @@ROWCOUNT;
EXEC ACCT.DBO.ESP_MIGLOG_INSERT @DEV_ID =\'\${DEVID}\', @JOB_CODE = \'\${JOBCD}\', @FILE_NM = \'\${FILENM}\', @REMARKS ='UPDATE COMO_APPMENU_VERSION', @TYPEVALUE ='U', @RCNT= @ROWCNT;
`;
export const migQueryMy = `
/****************************************************************************
NAME : 한재국
DATE : 2024.03.11
REMARKS : A24_01426 - 간이세액표 8세이상 20세이하 자녀세액 계산 방법 변경건 기획(세액,세율)
          * 2024.03.14 전존배포 예정건입니다.
****************************************************************************/

/* 1. Restore Query 

!!!restore_start

USE EC_HR;
DELETE FROM PSPY_TAX_BRACKET_UNTY
WHERE COM_CODE IN('ZA000','ZA001','ZA003','ZA005','ZA012')
AND TAX_BRACKET_CD = '80002';

SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'D', 'Restore - PSPY_TAX_BRACKET_UNTY', @INT);


DELETE FROM PSPY_CALCITEM_APPLY
WHERE COM_CODE IN('ZA000','ZA001','ZA003','ZA005','ZA012')
AND CALC_ITEM_SEQ = 88
AND APPLY_DATE = '2024-03-01';

SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'D', 'Restore - PSPY_CALCITEM_APPLY', @INT);


DELETE FROM PSPY_CALCMAPPING
WHERE COM_CODE IN('ZA000','ZA001','ZA003','ZA005','ZA012')
AND CALC_ITEM_SEQ = 88;

SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'D', 'Restore - PSPY_CALCMAPPING', @INT);


DELETE FROM PSPY_TAX_BRACKET_DETAIL_UNTY
WHERE COM_CODE IN('ZA000','ZA001','ZA003','ZA005','ZA012')
AND TAX_BRACKET_CD = '80002'
AND APPLY_DATE = '2024-03-01';

SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'D', 'Restore - PSPY_TAX_BRACKET_DETAIL_UNTY', @INT);

!!!restore_end             
*/

/* 2. BACKUP QUERY */

/* 3. Execute */

USE EC_HR;
-- 세율,세액 PSPY_TAX_BRACKET_UNTY
INSERT INTO PSPY_TAX_BRACKET_UNTY VALUES
	('ZA000', '80002', '8세이상20세이하자녀', '1', 'D', TRUE, TRUE, 4, 'ECOUNT', NOW(), 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '8세이상20세이하자녀', '1', 'D', TRUE, TRUE, 4, 'ECOUNT', NOW(), 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '8세이상20세이하자녀', '1', 'D', TRUE, TRUE, 4, 'ECOUNT', NOW(), 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '8세이상20세이하자녀', '1', 'D', TRUE, TRUE, 4, 'ECOUNT', NOW(), 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '8세이상20세이하자녀', '1', 'D', TRUE, TRUE, 4, 'ECOUNT', NOW(), 'ECOUNT', NOW(), 'P');
	
SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'I', 'ADD 80002', @INT);
	
	
-- 세율,세액 PSPY_CALCITEM_APPLY
INSERT INTO PSPY_CALCITEM_APPLY VALUES
	('ZA000', 88, '2024-03-01', 'P-TAD0000666', TRUE),
	('ZA001', 88, '2024-03-01', 'P-TAD0000666', TRUE),
	('ZA003', 88, '2024-03-01', 'P-TAD0000666', TRUE),
	('ZA005', 88, '2024-03-01', 'P-TAD0000666', TRUE),
	('ZA012', 88, '2024-03-01', 'P-TAD0000666', TRUE);
	
SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'I', 'ADD P-TAD0000666', @INT);
	
	
-- 세율,세액 PSPY_CALCMAPPING
INSERT INTO PSPY_CALCMAPPING VALUES
	('ZA000', 88, '80002', '1', 'TA', 'D', 'P'),
	('ZA001', 88, '80002', '1', 'TA', 'D', 'P'),
	('ZA003', 88, '80002', '1', 'TA', 'D', 'P'),
	('ZA005', 88, '80002', '1', 'TA', 'D', 'P'),
	('ZA012', 88, '80002', '1', 'TA', 'D', 'P');
	
SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'I', 'ADD 80002', @INT);
	
	
-- 세율,세액 상세 PSPY_TAX_BRACKET_DETAIL_UNTY
INSERT INTO PSPY_TAX_BRACKET_DETAIL_UNTY VALUES
	('ZA000', '80002', '2024-03-01', 1, 'O', 0, 0, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 2, 'O', 1, 12500, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 3, 'O', 2, 29160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 4, 'O', 3, 54160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 5, 'O', 4, 79160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 6, 'O', 5, 104160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 7, 'O', 6, 129160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 8, 'O', 7, 154160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 9, 'O', 8, 179160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 10, 'O', 9, 204160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 11, 'O', 10, 229160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 12, 'O', 11, 254160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 13, 'O', 12, 279160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 14, 'O', 13, 304160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 15, 'O', 14, 329160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA000', '80002', '2024-03-01', 16, 'O', 15, 354160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 1, 'O', 0, 0, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 2, 'O', 1, 12500, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 3, 'O', 2, 29160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 4, 'O', 3, 54160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 5, 'O', 4, 79160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 6, 'O', 5, 104160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 7, 'O', 6, 129160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 8, 'O', 7, 154160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 9, 'O', 8, 179160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 10, 'O', 9, 204160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 11, 'O', 10, 229160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 12, 'O', 11, 254160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 13, 'O', 12, 279160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 14, 'O', 13, 304160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 15, 'O', 14, 329160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA001', '80002', '2024-03-01', 16, 'O', 15, 354160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 1, 'O', 0, 0, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 2, 'O', 1, 12500, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 3, 'O', 2, 29160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 4, 'O', 3, 54160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 5, 'O', 4, 79160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 6, 'O', 5, 104160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 7, 'O', 6, 129160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 8, 'O', 7, 154160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 9, 'O', 8, 179160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 10, 'O', 9, 204160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 11, 'O', 10, 229160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 12, 'O', 11, 254160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 13, 'O', 12, 279160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 14, 'O', 13, 304160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 15, 'O', 14, 329160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA003', '80002', '2024-03-01', 16, 'O', 15, 354160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 1, 'O', 0, 0, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 2, 'O', 1, 12500, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 3, 'O', 2, 29160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 4, 'O', 3, 54160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 5, 'O', 4, 79160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 6, 'O', 5, 104160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 7, 'O', 6, 129160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 8, 'O', 7, 154160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 9, 'O', 8, 179160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 10, 'O', 9, 204160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 11, 'O', 10, 229160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 12, 'O', 11, 254160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 13, 'O', 12, 279160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 14, 'O', 13, 304160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 15, 'O', 14, 329160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA005', '80002', '2024-03-01', 16, 'O', 15, 354160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 1, 'O', 0, 0, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 2, 'O', 1, 12500, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 3, 'O', 2, 29160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 4, 'O', 3, 54160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 5, 'O', 4, 79160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 6, 'O', 5, 104160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 7, 'O', 6, 129160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 8, 'O', 7, 154160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 9, 'O', 8, 179160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 10, 'O', 9, 204160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 11, 'O', 10, 229160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 12, 'O', 11, 254160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 13, 'O', 12, 279160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 14, 'O', 13, 304160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 15, 'O', 14, 329160.000000, 'ECOUNT', NOW(), 'P'),
	('ZA012', '80002', '2024-03-01', 16, 'O', 15, 354160.000000, 'ECOUNT', NOW(), 'P');
	
SELECT ROW_COUNT() INTO @INT;
CALL EC_COMMON.ESP_MIGLOG_INSERT("\${DEVID}", "\${JOBCD}", "\${FILENM}", 'I', 'ADD 80002', @INT);
`;
export const migQueryPg = `
/* ***************************************************************************
remarks : A24_00735 게시판 코드형식 bizz_type으로만 조회하기
name : 이우열
date : 2024.03.29
*************************************************************************** */
/* 1. RESTORE QUERY: 
!!!restore_start

/*
기존 데이터 제거
*/
do $$										
declare pg_cnt2 integer := 0;					
declare v_tenant_sid text := '';					
declare v_row2 			record;
declare tcnt2 			integer :=0;
declare	tot_cnt2		integer :=0;
declare	delete_tot_cnt	integer :=0;
begin

	select count(*) into tot_cnt2
	from temp.delete_us_data_owner_setup_i_20240329_lwy_ecback;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'I', 'insert us_data_owner_setup_i loop start', 0);
	
	for v_row2 in (				
		select distinct tenant_sid from temp.delete_us_data_owner_setup_i_20240329_lwy_ecback		
	) 			
	loop		
		v_tenant_sid := v_row2.tenant_sid;			
		
        insert into setup.us_data_owner_setup_i
        select * from temp.delete_us_data_owner_setup_i_20240329_lwy_ecback
        where tenant_sid = v_tenant_sid;

		get diagnostics pg_cnt2 := row_count;	
		tcnt2 = tcnt2 + pg_cnt2;
		
		CALL ec_common.esp_miglog_insert_detail('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'I',concat('insert us_data_owner_setup_i(', v_tenant_sid, ')'), pg_cnt2, tcnt2, tot_cnt2);
					

		
		commit;
		
	end loop;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'I', 'insert us_data_owner_setup_i loop end', tcnt2);
end $$;

/*
기존 데이터 업데이트
*/
do $$										
declare pg_cnt2 integer := 0;					
declare v_tenant_sid text := '';					
declare v_row2 			record;
declare tcnt2 			integer :=0;
declare	tot_cnt2		integer :=0;
declare	update_tot_cnt	integer :=0;
begin

	select count(*) into tot_cnt2
	from temp.update_us_data_owner_setup_i_20240329_lwy_ecback;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'U', 'update us_data_owner_setup_i loop start', 0);
	
	for v_row2 in (				
		select distinct tenant_sid from temp.update_us_data_owner_setup_i_20240329_lwy_ecback		
	) 			
	loop		
		v_tenant_sid := v_row2.tenant_sid;			
				
		update setup.us_data_owner_setup_i a 
		set owner_sid = b.owner_sid
		from temp.update_us_data_owner_setup_i_20240329_lwy_ecback b
		where a.tenant_sid = b.tenant_sid	
		and a.owner_setup_sid = b.owner_setup_sid
		and a.tenant_sid = v_tenant_sid;

		get diagnostics pg_cnt2 := row_count;	
		tcnt2 = tcnt2 + pg_cnt2;
		
		CALL ec_common.esp_miglog_insert_detail('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'U',concat('update us_data_owner_setup_i(', v_tenant_sid, ')'), pg_cnt2, tcnt2, tot_cnt2);
					

		
		commit;
		
	end loop;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'U', 'update us_data_owner_setup_i loop end', tcnt2);
end $$;


!!!RESTORE_END   
*/

/* 2. BACKUP QUERY */

/* 3. EXECUTE */

-- 백업
DO $$

declare pg_cnt integer := 0;					


BEGIN

    --DELETE
    drop table if exists temp.delete_us_data_owner_setup_i_20240329_lwy_ecback;
    create table temp.delete_us_data_owner_setup_i_20240329_lwy_ecback as
    select * from setup.us_data_owner_setup_i
    where 1=2; 
    
    CREATE INDEX ix_delete_us_data_owner_setup_i_20240329_lwy_ecback ON temp.delete_us_data_owner_setup_i_20240329_lwy_ecback(tenant_sid, owner_setup_sid);
    
    -- UPDATE
    drop table if exists temp.update_us_data_owner_setup_i_20240329_lwy_ecback;
    create table temp.update_us_data_owner_setup_i_20240329_lwy_ecback as
    select * from setup.us_data_owner_setup_i
    where 1=2;
    
    CREATE INDEX ix_update_us_data_owner_setup_i_20240329_lwy_ecback ON temp.update_us_data_owner_setup_i_20240329_lwy_ecback(tenant_sid, owner_setup_sid);
    
    insert into temp.delete_us_data_owner_setup_i_20240329_lwy_ecback 
    select * from setup.us_data_owner_setup_i
    where target_bizz_sid = 'B_000000E200537'
    and owner_sid in ('BG_00000C000040', 'BG_00000C000042', 'BG_00000C000044', 'GROUPWARE'); -- DELETE BACKUP 
   
    get diagnostics pg_cnt := row_count;
    CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'I', 'backup delete_us_data_owner_setup_i_20240329_lwy_ecback ', pg_cnt);
    
    insert into temp.update_us_data_owner_setup_i_20240329_lwy_ecback
    select * from setup.us_data_owner_setup_i
    where target_bizz_sid = 'B_000000E200537'
    and owner_sid = 'BG_00000C000038'; -- UPDATE BACKUP
    
    get diagnostics pg_cnt := row_count;
    CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'I', 'backup update_us_data_owner_setup_i_20240329_lwy_ecback ', pg_cnt);
        
end $$;




/*
기존 데이터 제거
*/
do $$										
declare pg_cnt2 integer := 0;					
declare v_tenant_sid text := '';					
declare v_row2 			record;
declare tcnt2 			integer :=0;
declare	tot_cnt2		integer :=0;
declare	delete_tot_cnt	integer :=0;
begin

	select count(*) into tot_cnt2
	from temp.delete_us_data_owner_setup_i_20240329_lwy_ecback;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'D', 'delete us_data_owner_setup_i loop start', 0);
	
	for v_row2 in (				
		select distinct tenant_sid from temp.delete_us_data_owner_setup_i_20240329_lwy_ecback		
	) 			
	loop		
		v_tenant_sid := v_row2.tenant_sid;			
				
		delete from setup.us_data_owner_setup_i a 
		using temp.delete_us_data_owner_setup_i_20240329_lwy_ecback b
		where a.tenant_sid = b.tenant_sid	
		and a.owner_setup_sid = b.owner_setup_sid
		and a.tenant_sid = v_tenant_sid;

		get diagnostics pg_cnt2 := row_count;	
		    tcnt2 = tcnt2 + pg_cnt2;
		
		CALL ec_common.esp_miglog_insert_detail('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'D',concat('delete us_data_owner_setup_i(', v_tenant_sid, ')'), pg_cnt2, tcnt2, tot_cnt2);
					

		
		commit;
		
	end loop;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'D', 'delete us_data_owner_setup_i loop end', tcnt2);
end $$;

/*
기존 데이터 업데이트
*/
do $$										
declare pg_cnt2 integer := 0;					
declare v_tenant_sid text := '';					
declare v_row2 			record;
declare tcnt2 			integer :=0;
declare	tot_cnt2		integer :=0;
declare	update_tot_cnt	integer :=0;
begin

	select count(*) into tot_cnt2
	from temp.update_us_data_owner_setup_i_20240329_lwy_ecback;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'U', 'update us_data_owner_setup_i loop start', 0);
	
	for v_row2 in (				
		select distinct tenant_sid from temp.update_us_data_owner_setup_i_20240329_lwy_ecback		
	) 			
	loop		
		v_tenant_sid := v_row2.tenant_sid;			
				
		update setup.us_data_owner_setup_i a 
		set owner_sid = 'GROUPWARE'
		from temp.update_us_data_owner_setup_i_20240329_lwy_ecback b
		where a.tenant_sid = b.tenant_sid	
		and a.owner_setup_sid = b.owner_setup_sid
		and a.tenant_sid = v_tenant_sid;

		get diagnostics pg_cnt2 := row_count;	
		tcnt2 = tcnt2 + pg_cnt2;
		
		CALL ec_common.esp_miglog_insert_detail('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'U',concat('update us_data_owner_setup_i(', v_tenant_sid, ')'), pg_cnt2, tcnt2, tot_cnt2);
					

		
		commit;
		
	end loop;
	
	CALL ec_common.esp_miglog_insert ('\${DEVID}', '\${JOBCD}', '\${FILENM}', 'U', 'update us_data_owner_setup_i loop end', tcnt2);
end $$;
`;
