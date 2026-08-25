with open('services/petition_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''        # 5. Citizen notification
        self._notification_repo.create(
            Notification(
                user_id=citizen_id,
                message=(
                    f"Your petition \\"{petition.title}\\" has been submitted successfully."
                    + (" AI analysis is complete." if analysis_data else " It is pending AI analysis.")
                ),
            )
        )'''

new_str = '''        # 5. Citizen notification
        self._notification_repo.create(
            Notification(
                user_id=petition.submitted_by,
                message=(
                    f"Your petition \\"{petition.title}\\" has been submitted successfully."
                    + (" AI analysis is complete." if analysis_data else " It is pending AI analysis.")
                ),
            )
        )'''

if old_str in content:
    content = content.replace(old_str, new_str)
    with open('services/petition_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed petition_service.py")
else:
    print("Could not find the target string")
