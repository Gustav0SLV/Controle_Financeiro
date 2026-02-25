using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleFinanceiro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyGoalSavings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "saved_amount",
                table: "monthly_goals");

            migrationBuilder.DropColumn(
                name: "saved_description",
                table: "monthly_goals");

            migrationBuilder.CreateTable(
                name: "monthly_goal_savings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    monthly_goal_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    description = table.Column<string>(type: "varchar(200)", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_monthly_goal_savings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_monthly_goal_savings_monthly_goals_monthly_goal_id",
                        column: x => x.monthly_goal_id,
                        principalTable: "monthly_goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_monthly_goal_savings_monthly_goal_id",
                table: "monthly_goal_savings",
                column: "monthly_goal_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "monthly_goal_savings");

            migrationBuilder.AddColumn<decimal>(
                name: "saved_amount",
                table: "monthly_goals",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "saved_description",
                table: "monthly_goals",
                type: "varchar(300)",
                nullable: false,
                defaultValue: "");
        }
    }
}
