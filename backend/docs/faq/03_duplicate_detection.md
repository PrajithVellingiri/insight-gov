# How Duplicate Detection Works

InsightGov uses a state-of-the-art vector similarity engine (ChromaDB) combined with location-based heuristics to automatically detect duplicate petitions.

When you submit a petition, the AI compares its meaning and context against all previously submitted petitions. If it finds that another citizen has already reported the exact same issue (e.g., a pothole on the same street), your petition will be flagged as a potential duplicate.

**Why do we do this?**
- It reduces the workload on government officers by preventing them from reviewing the same issue multiple times.
- It allows the system to aggregate similar petitions, raising the priority of an issue that affects many citizens.

If your petition is flagged as a duplicate, it will be linked to the original master petition, and you will receive updates when the issue is resolved.
