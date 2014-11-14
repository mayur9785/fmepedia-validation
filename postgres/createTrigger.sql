-- Trigger for copying feature IDs to a temporary table, for later display

-- 1. Create Trigger Function
CREATE OR REPLACE FUNCTION cad_qa.temp_waterlines_id_copy() RETURNS trigger AS $temp_waterlines_id_copy$
DECLARE
	message	text;
	
BEGIN 
	IF (new.bulk_load <> 1 OR new.bulk_load IS NULL) THEN
		INSERT INTO cad_qa.temp_ids VALUES (new.primaryindex);
	END IF;
	RETURN NULL;
END 
$temp_waterlines_id_copy$ LANGUAGE plpgsql;

-- 2. Create Trigger
CREATE TRIGGER trg_copy_waterline_ids
AFTER INSERT ON cad_qa."WATERLINES" 
FOR EACH ROW EXECUTE PROCEDURE cad_qa.temp_waterlines_id_copy();