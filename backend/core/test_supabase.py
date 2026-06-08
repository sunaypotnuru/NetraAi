import asyncio
from app.services.supabase import supabase
from app.db.schema import Tables


async def test():
    try:
        print("Executing query...")
        resp = supabase.table(Tables.PROFILES_DOCTOR).select("id").limit(1).execute()
        print("Success:", resp)
    except Exception as e:
        print("Error:", e)
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
