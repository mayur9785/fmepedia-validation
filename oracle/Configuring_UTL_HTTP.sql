-- D014 Notifcation Demo   Script 2

-- This will give permissions to the Network (Local) and allow an HTTP request to be sent from Oracle.
--  
--RUN AS SYS USER

-- For User STEWART.
begin
  dbms_network_acl_admin.create_acl (
    acl         => 'utl_http.xml',
    description => 'Allow Network requests',
    principal   => 'SYSTEM',
    is_grant    => TRUE,
    privilege   => 'connect'
    );
    commit;
end;
/

-- For User STEWART.
begin
  dbms_network_acl_admin.add_privilege (
  acl       => 'utl_http.xml',
  principal => 'SYSTEM',
  is_grant  => TRUE,
  privilege => 'resolve'
  );
  commit;
end;
/

-- Assign ACL for localhost address.
begin
  dbms_network_acl_admin.assign_acl(
  acl  => 'utl_http.xml',
  host => 'localhost'
  );
  commit;
end;
/

-- Assign ACL for localhost address.
begin
  dbms_network_acl_admin.assign_acl(
  acl  => 'utl_http.xml',
  host => 'bd-lkdesktop'
  );
  commit;
end;
/

-- Assign ACL for fmeserver.com address.
begin
  dbms_network_acl_admin.assign_acl(
  acl  => 'utl_http.xml',
  host => 'fmeserver.com'
  );
  commit;
end;
/

--Grant ACCESS to to necessary user.
-- GRANT REQUIRED FOR USER 
GRANT EXECUTE ON UTL_HTTP TO SYSTEM;


