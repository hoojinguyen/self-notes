import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

let pgClient: PGlite | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function initializeDB() {
  if (!pgClient) {
    pgClient = new PGlite({
      dataDir: 'idb://haptic-notes'
    });
    
    // Run migrations
    await pgClient.exec(`
      CREATE TABLE IF NOT EXISTS collection (
        path text PRIMARY KEY,
        name text NOT NULL,
        last_opened timestamp with time zone NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collection_settings (
        collection_path text REFERENCES collection (path),
        editor jsonb NOT NULL,
        notes jsonb NOT NULL,
        PRIMARY KEY (collection_path)
      );

      CREATE TABLE IF NOT EXISTS entry (
        path text PRIMARY KEY,
        name text,
        parent_path text NOT NULL,
        collection_path text REFERENCES collection (path),
        content text,
        is_folder boolean DEFAULT false,
        size bigint,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      );

      -- Create function to update updated_at column
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for entry table
      DROP TRIGGER IF EXISTS update_entry_updated_at ON entry;
      CREATE TRIGGER update_entry_updated_at
        BEFORE UPDATE ON entry
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    dbInstance = drizzle(pgClient, { schema });
    
    // Create default collection if none exists
    await ensureDefaultCollection();
  }
  
  return { pgClient, db: dbInstance! };
}

export async function getDB() {
  if (!dbInstance) {
    await initializeDB();
  }
  return { pgClient: pgClient!, db: dbInstance! };
}

// Note operations
export async function saveNote(path: string, content: string, name?: string) {
  const { db } = await getDB();
  const collectionPath = '/default';
  
  try {
    await db.insert(schema.entry).values({
      path,
      name: name || path.split('/').pop()?.replace('.md', '') || 'Untitled',
      parentPath: path.substring(0, path.lastIndexOf('/')) || '/',
      collectionPath,
      content,
      isFolder: false,
      size: content.length,
    }).onConflictDoUpdate({
      target: schema.entry.path,
      set: {
        content,
        size: content.length,
        updatedAt: new Date(),
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to save note:', error);
    return false;
  }
}

export async function loadNote(path: string) {
  const { db } = await getDB();
  
  try {
    const result = await db.select().from(schema.entry).where(eq(schema.entry.path, path));
    return result[0] || null;
  } catch (error) {
    console.error('Failed to load note:', error);
    return null;
  }
}

export async function getAllNotes() {
  const { db } = await getDB();
  
  try {
    const result = await db.select().from(schema.entry).orderBy(schema.entry.updatedAt);
    return result;
  } catch (error) {
    console.error('Failed to get notes:', error);
    return [];
  }
}

export async function deleteNote(path: string) {
  const { db } = await getDB();
  
  try {
    await db.delete(schema.entry).where(eq(schema.entry.path, path));
    return true;
  } catch (error) {
    console.error('Failed to delete note:', error);
    return false;
  }
}

async function ensureDefaultCollection() {
  const { db } = await getDB();
  
  try {
    // Check if default collection exists
    const existingCollection = await db.select().from(schema.collection).where(eq(schema.collection.path, '/default'));
    
    if (existingCollection.length === 0) {
      // Create default collection
      await db.insert(schema.collection).values({
        path: '/default',
        name: 'My Notes',
        lastOpened: new Date(),
      });
      
      // Create default settings
      await db.insert(schema.collectionSettings).values({
        collectionPath: '/default',
        editor: { theme: 'default', fontSize: 14 },
        notes: { defaultTemplate: '' },
      });
    }
  } catch (error) {
    console.error('Failed to ensure default collection:', error);
  }
}
