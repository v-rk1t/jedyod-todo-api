CREATE TABLE IF NOT EXISTS "Todo" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Todo" (title, completed) VALUES 
('Go to Italy', true),
('Join Passione', false),
('Find the arrow', false)