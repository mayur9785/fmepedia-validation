------------------------------------------------
-- Waterlines data table                      --
-- Contains validated CAD data, loaded by FME --
------------------------------------------------

SET search_path TO cad_qa, public;

-- DROP TABLE "WATERLINES";

CREATE TABLE "WATERLINES"
(
  anno_diam character varying(255),
  compkey numeric(38,0),
  comptype numeric(38,0),
  diameter character varying(255),
  draw numeric(38,0),
  feature_id character varying(25),
  lead_main_ numeric(38,0),
  material character varying(8),
  primaryindex numeric(38,0) NOT NULL,
  project character varying(255),
  pr_zone character varying(4),
  status character varying(3),
  symcode numeric(38,0),
  symcode2 numeric(38,0),
  tile character varying(4),
  wnm_type character varying(8),
  year_insta numeric(38,0),
  autocad_elevation numeric(38,0),
  bulk_load numeric(38,0),
  CONSTRAINT pkey_feature PRIMARY KEY (primaryindex )
);
  
-- EPSG 2277 = Texas CF-83
SELECT AddGeometryColumn('cad_qa','WATERLINES','geom',2277,'LINESTRING',2);

-- Index: "WATERLINES_geom_1388688556114"

-- DROP INDEX "WATERLINES_geom_1388688556114";

CREATE INDEX "WATERLINES_geom_1388688556114"
  ON "WATERLINES"
  USING gist
  (geom );

---------------------------------
-- Temporary feature IDs table --
---------------------------------  

  -- DROP TABLE temp_ids;
CREATE TABLE temp_ids 
   (primaryindex numeric(38,0) NOT NULL);

