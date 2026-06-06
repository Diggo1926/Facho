-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "contextoExportado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "complexidade" TEXT,
    "descricao" TEXT,
    "icone" TEXT,
    "fase1" JSONB,
    "fase2" JSONB,
    "fase3" JSONB,
    "fase4" JSONB,
    "fase5" JSONB,
    "fase6" JSONB,
    "fase7" JSONB,
    "fase8" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTemplate" ADD CONSTRAINT "ProjectTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
