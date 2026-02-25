using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleFinanceiro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMonthlyGoalsStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Year",
                table: "monthly_goals",
                newName: "year");

            migrationBuilder.RenameColumn(
                name: "Month",
                table: "monthly_goals",
                newName: "month");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "monthly_goals",
                newName: "target_amount");

            migrationBuilder.RenameIndex(
                name: "IX_monthly_goals_Year_Month",
                table: "monthly_goals",
                newName: "IX_monthly_goals_year_month");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "saved_amount",
                table: "monthly_goals");

            migrationBuilder.DropColumn(
                name: "saved_description",
                table: "monthly_goals");

            migrationBuilder.RenameColumn(
                name: "year",
                table: "monthly_goals",
                newName: "Year");

            migrationBuilder.RenameColumn(
                name: "month",
                table: "monthly_goals",
                newName: "Month");

            migrationBuilder.RenameColumn(
                name: "target_amount",
                table: "monthly_goals",
                newName: "Amount");

            migrationBuilder.RenameIndex(
                name: "IX_monthly_goals_year_month",
                table: "monthly_goals",
                newName: "IX_monthly_goals_Year_Month");
        }
    }
}
