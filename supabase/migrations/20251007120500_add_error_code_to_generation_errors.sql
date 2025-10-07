-- migration: 20251007120500_add_error_code_to_generation_errors.sql
-- description: adds an error_code column to the generation_errors table.

-- add the error_code column to the generation_errors table
-- this will store a specific code for the error that occurred.
alter table generation_errors
add column error_code varchar(50);
