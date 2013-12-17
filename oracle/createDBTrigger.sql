--Create Trigger

create or replace
TRIGGER WATERLINES_INSERT_TEMP 
AFTER INSERT ON WATERLINES 
FOR EACH ROW 
--  FOLLOWS LIVEPOLY_NEW_TRG
  DECLARE vMsg VARCHAR2(30) := 'Row inserted.';
BEGIN
    IF :new.BULK_LOAD != 1 THEN
     INSERT INTO temp_ids VALUES (:new.FEATURE_ID);
     dbms_output.put_line(vMsg);
    END IF;
END WATERLINES_INSERT_TEMP;

--Create Function
--The request server address is currently set to localhost and may 
--need to be changed to match your own server name

create or replace
FUNCTION WATERLINES_HTTPREQUEST_FUNC RETURN char
IS 
  TYPE idSet IS TABLE OF temp_ids%ROWTYPE;
  writtenIds idSet;
  -- CLOB is necessary because of the length limit of VARCHAR
  message CLOB;
  list_val CLOB;
  deleter CLOB;
  returnVal INTEGER(1) := 0;
  
  vMsg VARCHAR2(30) := 'Trigger Fired.';
  req utl_http.req;
  resp utl_http.resp;
  
BEGIN
    dbms_output.put_line('Procedure started');
    SELECT feature_id BULK COLLECT INTO writtenids FROM temp_ids;
    
    FOR i IN writtenids.FIRST .. writtenids.LAST
    LOOP
      IF i != writtenids.LAST THEN
        
        list_val := list_val || TO_CLOB('"' || writtenids(i).feature_id || '",');
      ELSE
        list_val := list_val || TO_CLOB('"' || writtenids(i).feature_id || '"');
      END IF;
      
    END LOOP ;
    
    message := 'type=i&list='||list_val;
    
    
    dbms_output.put_line(message);
    -- because of the length it is necessary to send it over a POST request
    req := utl_http.begin_request('http://localhost/fmejobsubmitter/fmepedia_demos/D001%20-%20pushertrigger_collection.fmw','POST');
    utl_http.set_header(req, 'User-Agent', 'Mozilla/4.0');
    UTL_HTTP.SET_HEADER(req,'Content-Type','application/x-www-form-urlencoded');
    utl_http.set_header(req, 'content-length', length(message));
    utl_http.write_text(req, message);
    --utl_http.end_request(req);
    resp := utl_http.get_response(req);
    utl_http.set_transfer_timeout(0.1);
    utl_http.end_response(resp);
    
    RETURN 'Y';
EXCEPTION
    WHEN utl_http.end_of_body THEN
    utl_http.end_response(resp);
    WHEN OTHERS THEN  
    RETURN 'F';
END WATERLINES_HTTPREQUEST_FUNC;
