import { prisma } from "../src/db";

export default async function teardown() {
  await prisma.$disconnect();
}
