CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (requester_id != addressee_id)
);

CREATE UNIQUE INDEX unique_friendship_idx ON friendships (
  LEAST(requester_id, addressee_id), 
  GREATEST(requester_id, addressee_id)
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  author_id UUID NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  author_id UUID NOT NULL,
  post_id UUID NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);




-- 1. Insert Users with Bcrypt Hash for password "111111"
-- Note: All users share the same password: "111111"
INSERT INTO users (username, email, password_hash, first_name, last_name, bio)
VALUES 
('tzipora_dev', 'tzipora@gmail.com', '$2b$10$4kQFxiMhkGlzePVkMKib4uejS7g6mVgLQcmgeN9O7jFlH5WC1fdjC', 'Tzipora', 'Dev', 'Computer Science student. Passionate about Full Stack and Node.js architecture.'),
('gila_k', 'gila@gmail.com', '$2b$10$4kQFxiMhkGlzePVkMKib4uejS7g6mVgLQcmgeN9O7jFlH5WC1fdjC', 'Gila', 'Kassab', 'Software Engineer. Expert in React and system scalability.'),
('osnat_s', 'osnat@gmail.com', '$2b$10$4kQFxiMhkGlzePVkMKib4uejS7g6mVgLQcmgeN9O7jFlH5WC1fdjC', 'Osnat', 'Shachor', 'Backend developer focused on solving complex algorithms and clean code.'),
('sara_b', 'sara@gmail.com', '$2b$10$4kQFxiMhkGlzePVkMKib4uejS7g6mVgLQcmgeN9O7jFlH5WC1fdjC', 'Sara', 'Blassberger', 'Web developer with a deep love for UI/UX design and user experience.');

-- 2. Insert Realistic Posts
INSERT INTO posts (author_id, content, visibility)
VALUES 
(
    (SELECT id FROM users WHERE username = 'tzipora_dev'), 
    'I finally implemented a full JWT auth flow with Refresh Tokens! It was challenging but totally worth it. Does anyone need help with the setup?', 
    'PUBLIC'
),
(
    (SELECT id FROM users WHERE username = 'gila_k'), 
    'React Tip: Always use useEffect carefully to avoid infinite loops. Speaking from experience after a long debugging session this morning... 😅', 
    'PUBLIC'
);

-- 3. Insert Comments
INSERT INTO comments (author_id, post_id, content)
VALUES 
(
    (SELECT id FROM users WHERE username = 'osnat_s'), 
    (SELECT id FROM posts WHERE content LIKE '%JWT%'), 
    'Great job Tzipora! Security is such a critical part of any application.'
),
(
    (SELECT id FROM users WHERE username = 'tzipora_dev'), 
    (SELECT id FROM posts WHERE content LIKE '%React Tip%'), 
    'Oh Gila, that is exactly what happened to me yesterday with my Axios Interceptors!'
);

-- 4. Insert Friendships
INSERT INTO friendships (requester_id, addressee_id, status)
VALUES 
(
    (SELECT id FROM users WHERE username = 'tzipora_dev'), 
    (SELECT id FROM users WHERE username = 'gila_k'), 
    'ACCEPTED'
),
(
    (SELECT id FROM users WHERE username = 'osnat_s'), 
    (SELECT id FROM users WHERE username = 'tzipora_dev'), 
    'ACCEPTED'
),
(
    (SELECT id FROM users WHERE username = 'sara_b'), 
    (SELECT id FROM users WHERE username = 'tzipora_dev'), 
    'PENDING'
);

-- 5. Insert Initial Messages
INSERT INTO messages (sender_id, receiver_id, content)
VALUES 
(
    (SELECT id FROM users WHERE username = 'tzipora_dev'), 
    (SELECT id FROM users WHERE username = 'gila_k'), 
    'Hey Gila, I sent you the pull request with the fix on GitHub, did you see it?'
);