<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class SapController extends Controller
{
    private string $baseUrl;
    private string $company;
    private string $user;
    private string $password;

    public function __construct()
    {
        $this->baseUrl  = config("services.sap.url", "");
        $this->company  = config("services.sap.company", "");
        $this->user     = config("services.sap.user", "");
        $this->password = config("services.sap.password", "");
    }

    public function clientes(Request $req): JsonResponse
    {
        $q = $req->get("q", "");

        $clientes = Cache::remember("sap_clientes_{$q}", 300, function () use ($q) {
            try {
                $session = $this->getSession();
                if (!$session) return [];

                $filter = $q
                    ? "\$filter=contains(CardName,'$q') or contains(CardCode,'$q')"
                    : "\$top=50";

                $res = Http::withCookies($session["cookies"], parse_url($this->baseUrl, PHP_URL_HOST))
                    ->withOptions(["verify" => false])
                    ->get("{$this->baseUrl}/BusinessPartners?\$select=CardCode,CardName,EmailAddress&{$filter}");

                if ($res->successful()) {
                    return collect($res->json("value", []))->map(fn($c) => [
                        "codigo" => $c["CardCode"],
                        "nombre" => $c["CardName"],
                        "email"  => $c["EmailAddress"] ?? null,
                    ])->all();
                }
            } catch (\Exception $e) {
                \Log::warning("SAP B1 error: " . $e->getMessage());
            }
            return [];
        });

        return response()->json($clientes);
    }

    public function articulos(Request $req): JsonResponse
    {
        $q = $req->get("q", "");

        $items = Cache::remember("sap_items_{$q}", 300, function () use ($q) {
            try {
                $session = $this->getSession();
                if (!$session) return [];

                $filter = $q
                    ? "\$filter=contains(ItemName,'$q') or contains(ItemCode,'$q')"
                    : "\$top=50";

                $res = Http::withCookies($session["cookies"], parse_url($this->baseUrl, PHP_URL_HOST))
                    ->withOptions(["verify" => false])
                    ->get("{$this->baseUrl}/Items?\$select=ItemCode,ItemName,SalesUnit&{$filter}");

                if ($res->successful()) {
                    return collect($res->json("value", []))->map(fn($i) => [
                        "itemCode" => $i["ItemCode"],
                        "nombre"   => $i["ItemName"],
                        "unidad"   => $i["SalesUnit"] ?? null,
                    ])->all();
                }
            } catch (\Exception $e) {
                \Log::warning("SAP B1 error: " . $e->getMessage());
            }
            return [];
        });

        return response()->json($items);
    }

    private function getSession(): ?array
    {
        if (!$this->baseUrl) return null;

        try {
            $res = Http::withOptions(["verify" => false])
                ->post("{$this->baseUrl}/Login", [
                    "CompanyDB" => $this->company,
                    "UserName"  => $this->user,
                    "Password"  => $this->password,
                ]);

            if ($res->successful()) {
                return ["cookies" => $res->cookies()];
            }
        } catch (\Exception $e) {
            \Log::warning("SAP login failed: " . $e->getMessage());
        }
        return null;
    }
}
