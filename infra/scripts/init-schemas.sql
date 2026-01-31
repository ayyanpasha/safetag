-- Create separate schemas for each service
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS vehicle;
CREATE SCHEMA IF NOT EXISTS sheriff;
CREATE SCHEMA IF NOT EXISTS comms;
CREATE SCHEMA IF NOT EXISTS payment;
CREATE SCHEMA IF NOT EXISTS affiliate;
CREATE SCHEMA IF NOT EXISTS incident;

-- Grant usage to the safetag user
GRANT ALL ON SCHEMA auth TO safetag;
GRANT ALL ON SCHEMA vehicle TO safetag;
GRANT ALL ON SCHEMA sheriff TO safetag;
GRANT ALL ON SCHEMA comms TO safetag;
GRANT ALL ON SCHEMA payment TO safetag;
GRANT ALL ON SCHEMA affiliate TO safetag;
GRANT ALL ON SCHEMA incident TO safetag;
