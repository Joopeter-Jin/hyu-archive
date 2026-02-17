export type Category =
  | "about"
  | "debates"
  | "reading-notes"
  | "class-seminars"
  | "concepts"
  | "news"

export function categoryToPath(category: Category) {
  switch (category) {
    case "about":
      return "/about"
    case "debates":
      return "/debates"
    case "reading-notes":
      return "/reading-notes"
    case "class-seminars":
      return "/class-seminars"
    case "concepts":
      return "/concepts"
    case "news":
      return "/news"
    default:
      return "/"
  }
}
