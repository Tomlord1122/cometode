import Database from 'better-sqlite3'
import neetcodeProblems from '../../../resources/neetcode-150.json'

interface Problem {
  neet_id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  categories: string[]
  tags: string[]
  leetcode_url: string
  neetcode_url: string
}

export function seedProblems(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT INTO problems (neet_id, title, difficulty, categories, tags, leetcode_url, neetcode_url)
    VALUES (@neet_id, @title, @difficulty, @categories, @tags, @leetcode_url, @neetcode_url)
  `)

  const insertMany = db.transaction((problems: Problem[]) => {
    for (const problem of problems) {
      insert.run({
        neet_id: problem.neet_id,
        title: problem.title,
        difficulty: problem.difficulty,
        categories: JSON.stringify(problem.categories),
        tags: JSON.stringify(problem.tags),
        leetcode_url: problem.leetcode_url,
        neetcode_url: problem.neetcode_url
      })
    }
  })

  insertMany(neetcodeProblems as Problem[])
  console.log(`Seeded ${neetcodeProblems.length} problems`)
}
