using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvergreenNotes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGardenCareSpacedRepetition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CachedReviewQuestion",
                table: "Notes",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CachedReviewQuestionContentHash",
                table: "Notes",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CachedReviewQuestionGeneratedAt",
                table: "Notes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CurrentReviewIntervalDays",
                table: "Notes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReviewedAt",
                table: "Notes",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "NextReviewAt",
                table: "Notes",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ReviewCount",
                table: "Notes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Notes_UserId_IsDeleted_NextReviewAt",
                table: "Notes",
                columns: new[] { "UserId", "IsDeleted", "NextReviewAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notes_UserId_IsDeleted_NextReviewAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "CachedReviewQuestion",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "CachedReviewQuestionContentHash",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "CachedReviewQuestionGeneratedAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "CurrentReviewIntervalDays",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "LastReviewedAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "NextReviewAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "ReviewCount",
                table: "Notes");
        }
    }
}
