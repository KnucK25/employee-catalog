PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. ТАБЛИЦЫ
-- ==========================================

CREATE TABLE IF NOT EXISTS departament (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image (
  id INTEGER PRIMARY KEY,
  binary_image BLOB NOT NULL,
  mime_type TEXT NOT NULL CHECK(mime_type IN ('jpeg', 'png', 'webp')),
  size_bytes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employee (
  id INTEGER PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  middlename TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_admission TEXT DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  departament_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  image_id INTEGER,
  FOREIGN KEY (departament_id) REFERENCES departament(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (image_id) REFERENCES image(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS root (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id INTEGER PRIMARY KEY,
  login TEXT NOT NULL,
  hash TEXT NOT NULL,
  salt BLOB NOT NULL,
  employee_id INTEGER NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==========================================
-- 2. ИНДЕКСЫ
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_departament_name ON departament(name);
CREATE INDEX IF NOT EXISTS idx_post_name ON post(name);

CREATE INDEX IF NOT EXISTS idx_employee_departament_id ON employee(departament_id);
CREATE INDEX IF NOT EXISTS idx_employee_post_id ON employee(post_id);
CREATE INDEX IF NOT EXISTS idx_employee_image_id ON employee(image_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_email ON employee(email);
CREATE INDEX IF NOT EXISTS idx_employee_name_search ON employee(lastname, firstname);
CREATE INDEX IF NOT EXISTS idx_employee_phone ON employee(phone);

CREATE INDEX IF NOT EXISTS idx_root_employee_id ON root(employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_login ON account(login);
CREATE INDEX IF NOT EXISTS idx_account_employee_id ON account(employee_id);