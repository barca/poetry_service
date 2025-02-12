-- Enable the UUID generation extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------
-- USERS TABLE
-------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  -- additional fields such as email or password_hash can be added here
  created_at TIMESTAMP DEFAULT now()
);

-------------------------------------------
-- AUTHORS TABLE
-------------------------------------------
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  image_url TEXT,               -- Changed to TEXT for arbitrary-length URLs
  biography TEXT,
  lifespan VARCHAR(100),
  place_of_birth VARCHAR(255),
  place_of_residence VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-------------------------------------------
-- POEMS TABLE
-------------------------------------------
CREATE TABLE poems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  image_url TEXT,               -- Changed to TEXT for arbitrary-length URLs
  written_date DATE,
  rating NUMERIC,               -- Adjust precision if needed
  created_at TIMESTAMP DEFAULT now()
);

-------------------------------------------
-- LIBRARIES TABLE
-------------------------------------------
CREATE TABLE libraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,               -- Changed to TEXT for arbitrary-length URLs
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

-------------------------------------------
-- COMMENTS TABLE
-------------------------------------------
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poem_id UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-------------------------------------------
-- JOIN TABLE: LIBRARIES <-> POEMS
-------------------------------------------
CREATE TABLE library_poems (
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  poem_id UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
  PRIMARY KEY (library_id, poem_id)
);

-------------------------------------------
-- JOIN TABLE: USERS LIKE POEMS
-------------------------------------------
CREATE TABLE user_liked_poems (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poem_id UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, poem_id)
);

-------------------------------------------
-- JOIN TABLE: USERS LIKE AUTHORS
-------------------------------------------
CREATE TABLE user_liked_authors (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, author_id)
);

-------------------------------------------
-- JOIN TABLE: USERS LIKE COMMENTS
-------------------------------------------
CREATE TABLE user_liked_comments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

-------------------------------------------
-- JOIN TABLE: USERS HAVE READ POEMS
-------------------------------------------
CREATE TABLE user_read_poems (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poem_id UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, poem_id)
);
