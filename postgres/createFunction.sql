-- 5. Create HTTP function
-- It seems like there is no built-in function in PL/pgSQL (2012-09-25). Therefore, a small PL/Python script is used to send the request. All further logic is written in PL/pgSQL.
CREATE OR REPLACE FUNCTION send_request(url text, param1 text) RETURNS text AS

# Documentation for httplib: http://docs.python.org/library/httplib.html
import httplib, urllib
# http://stackoverflow.com/questions/449775/how-can-i-split-a-url-string-up-into-separate-parts-in-python
from urlparse import urlparse

parse_object = urlparse(args[0])

# params = urllib.urlencode(args[1])
headers = {"Content-type": "application/x-www-form-urlencoded"}
url = args[1]
conn = httplib.HTTPConnection(parse_object.netloc)
conn.request("POST", parse_object.path, args[1], headers)

return args[0]+args[1]

LANGUAGE 'plpythonu';

-- 6. Create workspace calling function
CREATE OR REPLACE FUNCTION cadqa_notify_insert_done() RETURNS text AS $$
DECLARE
	message	text;
	
BEGIN 
	SELECT 'minID=' || cast(min(primaryindex) AS text) || '&maxID=' ||cast (max(primaryindex) AS text)
	INTO message
	FROM temp_ids;

	PERFORM send_request('http://raster-safe-software-test.fmecloud.com/fmejobsubmitter/validation/websocket-stream.fmw',message);

	RETURN 'Y';

END 
$$ LANGUAGE plpgsql;