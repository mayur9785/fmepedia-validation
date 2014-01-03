-- Trigger for copying feature IDs to a temporary table, for later display

-- 1. Create Trigger Function
CREATE OR REPLACE FUNCTION temp_waterlines_id_copy() RETURNS trigger AS $temp_waterlines_id_copy$
DECLARE
	message	text;
	
BEGIN 
	IF (new.bulk_load <> 1 OR new.bulk_load IS NULL) THEN
		INSERT INTO temp_ids VALUES (new.feature_id);
	END IF;
	RETURN NULL;
END 
$temp_waterlines_id_copy$ LANGUAGE plpgsql;

-- 2. Create Trigger
CREATE TRIGGER trg_copy_waterline_ids
AFTER INSERT ON "WATERLINES" 
FOR EACH ROW EXECUTE PROCEDURE temp_waterlines_id_copy();