using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleFinanceiro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyIncome : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_transactions_categories_CategoryId",
                table: "transactions");

            migrationBuilder.CreateTable(
                name: "monthly_incomes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_monthly_incomes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transactions_CategoryId_Date",
                table: "transactions",
                columns: new[] { "CategoryId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_transactions_Date_Type",
                table: "transactions",
                columns: new[] { "Date", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_monthly_incomes_Year_Month",
                table: "monthly_incomes",
                columns: new[] { "Year", "Month" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_transactions_categories_categoryId",
                table: "transactions",
                column: "CategoryId",
                principalTable: "categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_transactions_categories_categoryId",
                table: "transactions");

            migrationBuilder.DropTable(
                name: "monthly_incomes");

            migrationBuilder.DropIndex(
                name: "IX_transactions_CategoryId_Date",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "IX_transactions_Date_Type",
                table: "transactions");

            migrationBuilder.AddForeignKey(
                name: "FK_transactions_categories_CategoryId",
                table: "transactions",
                column: "CategoryId",
                principalTable: "categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
