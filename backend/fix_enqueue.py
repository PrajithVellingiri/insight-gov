with open('services/petition_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """        # Enqueue the background task for AI analysis
        try:
            from worker import process_petition_ai_analysis
            process_petition_ai_analysis.delay(str(petition.id), citizen_name)
            logger.info("Enqueued AI analysis task for petition %s", petition.id)
        except Exception as e:
            logger.error("Failed to enqueue AI analysis task (Redis unavailable?), falling back to synchronous execution: %s", e)
            await self.process_ai_analysis_task(petition.id, citizen_name)"""

old_str = """        # Enqueue the background task for AI analysis
        try:
            from worker import process_petition_ai_analysis
            process_petition_ai_analysis.delay(str(petition.id), citizen_name)
            logger.info("Enqueued AI analysis task for petition %s", petition.id)
        except Exception as e:
            logger.error("Failed to enqueue AI analysis task for petition %s: %s", petition.id, e)"""

content = content.replace(old_str, replacement)

with open('services/petition_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
