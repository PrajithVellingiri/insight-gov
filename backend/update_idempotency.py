with open('services/petition_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    async def process_ai_analysis_task(self, petition_id: UUID, citizen_name: str):
        petition = self._petition_repo.get_by_id(petition_id)
        if not petition:
            logger.error("Petition %s not found for AI analysis task.", petition_id)
            return

        if petition.status != "pending":
            logger.info("Petition %s already processed (status: %s)", petition_id, petition.status)
            return
            
        if self._ai_analysis_repo.get_by_petition_id(petition_id):
            logger.info("Petition %s already has AI analysis.", petition_id)
            return"""

old_str = """    async def process_ai_analysis_task(self, petition_id: UUID, citizen_name: str):
        petition = self._petition_repo.get_by_id(petition_id)
        if not petition:
            logger.error("Petition %s not found for AI analysis task.", petition_id)
            return"""

content = content.replace(old_str, replacement)

with open('services/petition_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
