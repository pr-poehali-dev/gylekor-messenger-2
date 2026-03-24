CREATE TABLE t_p54536790_gylekor_messenger_2.users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar VARCHAR(10) DEFAULT '🦊',
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  session_token VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p54536790_gylekor_messenger_2.contacts (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES t_p54536790_gylekor_messenger_2.users(id),
  contact_id INTEGER REFERENCES t_p54536790_gylekor_messenger_2.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, contact_id)
);

CREATE TABLE t_p54536790_gylekor_messenger_2.webrtc_signals (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(100) NOT NULL,
  from_user_id INTEGER,
  to_user_id INTEGER,
  type VARCHAR(20) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webrtc_signals_room ON t_p54536790_gylekor_messenger_2.webrtc_signals(room_id, created_at);
CREATE INDEX idx_users_phone ON t_p54536790_gylekor_messenger_2.users(phone);
CREATE INDEX idx_users_username ON t_p54536790_gylekor_messenger_2.users(username);
